import json, boto3, datetime
from zoneinfo import ZoneInfo
from bisect import bisect_left

s3 = boto3.client("s3")

def lambda_handler(event, context):
    bris = ZoneInfo("Australia/Brisbane")
    now_bris = datetime.datetime.now(bris)

    yesterday = (now_bris - datetime.timedelta(days=1)).date()
    ydate = yesterday.strftime("%Y-%m-%d")
    yprefix = f"GC{ydate}"

    record_bucket   = "record-wind"
    forecast_bucket = "forecast-wind"
    analysis_bucket = "analysis-wind"

    # read actual data
    record_key = f"{yprefix}.json"
    record_obj = s3.get_object(Bucket=record_bucket, Key=record_key)
    record_raw = json.loads(record_obj["Body"].read())
    actual_points = record_raw["observationalGraphs"]["wind"]["dataConfig"]["series"]["groups"][0]["points"]

    # read forecast dat
    forecast_key = f"{yprefix}.json"
    forecast_obj = s3.get_object(Bucket=forecast_bucket, Key=forecast_key)
    forecast_raw = json.loads(forecast_obj["Body"].read())

    start_bris = datetime.datetime(yesterday.year, yesterday.month, yesterday.day, 0, 0, 0, tzinfo=bris)
    end_bris   = start_bris + datetime.timedelta(days=1)

    # collect forecast entries 
    raw_entries = []
    for day in forecast_raw["forecasts"]["wind"]["days"]:
        for e in day["entries"]:
            ts = datetime.datetime.fromisoformat(e["dateTime"])
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=bris)
            else:
                ts = ts.astimezone(bris)
            if start_bris <= ts < end_bris:
                raw_entries.append({
                    "ts": ts,
                    "wind_knots": e["speed"] * 0.539957  # km/h → knots
                })
    raw_entries.sort(key=lambda p: p["ts"])

    # interpolate forecast to 10 min steps
    forecast_points = []
    for a, b in zip(raw_entries, raw_entries[1:]):
        forecast_points.append({"ts": a["ts"], "wind_knots": a["wind_knots"]})
        t = a["ts"]
        while (t + datetime.timedelta(minutes=10)) < b["ts"]:
            t += datetime.timedelta(minutes=10)
            frac = (t - a["ts"]).total_seconds() / (b["ts"] - a["ts"]).total_seconds()
            interp_val = a["wind_knots"] + frac * (b["wind_knots"] - a["wind_knots"])
            forecast_points.append({"ts": t, "wind_knots": interp_val})
    if raw_entries:
        forecast_points.append(raw_entries[-1])

    forecast_times = [f["ts"] for f in forecast_points]
    forecast_knots = [f["wind_knots"] for f in forecast_points]

    def find_nearest_forecast(ts):
        if not forecast_times:
            return None
        i = bisect_left(forecast_times, ts)
        if i == 0:
            return forecast_knots[0]
        if i == len(forecast_times):
            return forecast_knots[-1]
        before, after = forecast_times[i-1], forecast_times[i]
        if abs((ts - before).total_seconds()) <= abs((after - ts).total_seconds()):
            return forecast_knots[i-1]
        return forecast_knots[i]

    # Merge 
    merged = []
    for p in actual_points:
        # treat as already Brisbane local 
        ts = datetime.datetime.utcfromtimestamp(p["x"]).replace(tzinfo=bris)
        if not (start_bris <= ts < end_bris):
            continue
        merged.append({
            "time": ts.isoformat(),        # full ISO timestamp with timezone
            "actual": p["y"] * 0.539957,   #  knots
            "predicted": find_nearest_forecast(ts)
        })

    # save
    out = {
        "metadata": {
            "station": "Gold Coast Seaway",
            "unit": "knots",
            "date": ydate
        },
        "data": merged
    }

    out_key = f"{yprefix}.json"
    s3.put_object(
        Bucket=analysis_bucket,
        Key=out_key,
        Body=json.dumps(out),
        ContentType="application/json"
    )

    # daily metrics file creation
    upsert_daily_metrics_from_merged(
        merged=merged,
        ydate=ydate,
        s3_client=s3,
        bucket=analysis_bucket,
        station=out["metadata"]["station"],
        unit=out["metadata"]["unit"],
        now_bris=now_bris,
    )

    return {"statusCode": 200, "body": f"analysis {out_key} saved"}

# daily metrics analysis
def upsert_daily_metrics_from_merged(
    merged: list,
    ydate: str,
    s3_client,
    bucket: str,
    station: str,
    unit: str,
    now_bris,              # datetime in Brisbane tz (for updated_at)
    model_id: str = "willyweather",
    expected_slots: int = 144,
):
    """
    Compute daily metrics from the in-memory `merged` 10-min pairs and
    upsert into analysis bucket as GCdaily.json.
    """
    EPS = 1e-6

    # collect valid pairs
    pairs = []
    for row in merged:
        a = row.get("actual")
        p = row.get("predicted")
        if isinstance(a, (int, float)) and isinstance(p, (int, float)):
            pairs.append((float(a), float(p)))

    n = len(pairs)
    if n > 0:
        abs_err = [abs(a - p) for a, p in pairs]
        sq_err  = [(a - p) ** 2 for a, p in pairs]
        bias_v  = [p - a for a, p in pairs]
        smape_v = [2 * abs(a - p) / (abs(a) + abs(p) + EPS) for a, p in pairs]
        mean_a  = sum(a for a, _ in pairs) / n
        mean_p  = sum(p for _, p in pairs) / n

        daily_entry = {
            "date": ydate,
            "n": n,
            "coverage": n / float(expected_slots),
            "mae": sum(abs_err) / n,
            "rmse": (sum(sq_err) / n) ** 0.5,
            "bias": sum(bias_v) / n,
            "smape": sum(smape_v) / n,
            "mean_actual": mean_a,
            "mean_predicted": mean_p,
        }
    else:
        daily_entry = {
            "date": ydate, "n": 0, "coverage": 0.0,
            "mae": None, "rmse": None, "bias": None, "smape": None,
            "mean_actual": None, "mean_predicted": None,
        }

    # Load existing GCdaily.json 
    daily_key = "GCdaily.json"
    try:
        existing = s3_client.get_object(Bucket=bucket, Key=daily_key)
        daily_obj = json.loads(existing["Body"].read())
    except Exception:
        daily_obj = {
            "station": station,
            "unit": unit,
            "model_id": model_id,
            "daily": []
        }

    # Upsert yesterdays entry
    daily_list = [d for d in daily_obj.get("daily", []) if d.get("date") != ydate]
    daily_list.append(daily_entry)
    daily_list.sort(key=lambda d: d["date"])  # keep ascending order

    daily_obj["station"] = daily_obj.get("station", station)
    daily_obj["unit"] = daily_obj.get("unit", unit)
    daily_obj["model_id"] = daily_obj.get("model_id", model_id)
    daily_obj["daily"] = daily_list
    daily_obj["updated_at"] = now_bris.isoformat()

    # Save back
    s3_client.put_object(
        Bucket=bucket,
        Key=daily_key,
        Body=json.dumps(daily_obj),
        ContentType="application/json"
    )

    print(
        f"Daily metrics upserted for {ydate}: "
        f"n={daily_entry['n']}, coverage={daily_entry['coverage']:.3f}, "
        f"mae={daily_entry['mae']}, rmse={daily_entry['rmse']}, "
        f"bias={daily_entry['bias']}, smape={daily_entry['smape']}"
    )
