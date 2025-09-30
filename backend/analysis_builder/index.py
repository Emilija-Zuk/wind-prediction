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

    # ollect forecast entries 
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
        # ⚠️ Treat obs x as already Brisbane local (WillyWeather quirk!)
        ts = datetime.datetime.utcfromtimestamp(p["x"]).replace(tzinfo=bris)
        if not (start_bris <= ts < end_bris):
            continue
        merged.append({
            "time": ts.isoformat(),        # full ISO timestamp with timezone
            "actual": p["y"] * 0.539957,   # km/h → knots
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

    return {"statusCode": 200, "body": f"analysis {out_key} saved"}
