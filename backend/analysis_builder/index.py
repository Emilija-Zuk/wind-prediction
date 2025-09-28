import json
import boto3
import datetime
from zoneinfo import ZoneInfo
from bisect import bisect_left

s3 = boto3.client("s3")

def lambda_handler(event, context):
    bris = ZoneInfo("Australia/Brisbane")
    now_bris = datetime.datetime.now(bris)


    yesterday = now_bris - datetime.timedelta(days=1)
    ydate = yesterday.strftime("%Y-%m-%d")
    yprefix = f"GC{ydate}"

    record_bucket   = "record-wind"
    forecast_bucket = "forecast-wind"
    analysis_bucket = "analysis-wind"

    # load yesterdays actual data
    record_key = f"{yprefix}.json"
    record_obj = s3.get_object(Bucket=record_bucket, Key=record_key)
    record_raw = json.loads(record_obj["Body"].read())
    actual_points = record_raw["observationalGraphs"]["wind"]["dataConfig"]["series"]["groups"][0]["points"]

    # load forecast issued yesterday
    forecast_key = f"{yprefix}.json"
    forecast_obj = s3.get_object(Bucket=forecast_bucket, Key=forecast_key)
    forecast_raw = json.loads(forecast_obj["Body"].read())

    start_bris = datetime.datetime.strptime(ydate, "%Y-%m-%d").replace(tzinfo=bris)
    end_bris   = start_bris + datetime.timedelta(days=1)

    # Collect and interpolate forecast data to 10min steps
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
                    "wind_knots": e["speed"] * 0.539957
                })
    raw_entries.sort(key=lambda p: p["ts"])

    forecast_points = []
    for a, b in zip(raw_entries, raw_entries[1:]):
        forecast_points.append({
            "ts": a["ts"], "x": a["ts"].strftime("%H:%M"), "wind_knots": a["wind_knots"]
        })
        t = a["ts"]
        while (t + datetime.timedelta(minutes=10)) < b["ts"]:
            t += datetime.timedelta(minutes=10)
            frac = (t - a["ts"]).total_seconds() / (b["ts"] - a["ts"]).total_seconds()
            forecast_points.append({
                "ts": t,
                "x": t.strftime("%H:%M"),
                "wind_knots": a["wind_knots"] + frac * (b["wind_knots"] - a["wind_knots"])
            })
    if raw_entries:
        last = raw_entries[-1]
        forecast_points.append({
            "ts": last["ts"], "x": last["ts"].strftime("%H:%M"), "wind_knots": last["wind_knots"]
        })

    forecast_times = [f["ts"] for f in forecast_points]
    forecast_knots = [f["wind_knots"] for f in forecast_points]

    def find_nearest_forecast(ts):
        if not forecast_times:
            return None
        i = bisect_left(forecast_times, ts)
        if i == 0:
            return forecast_knots[0] if abs((forecast_times[0] - ts).total_seconds())/60 <= 5 else None
        if i == len(forecast_times):
            return forecast_knots[-1] if abs((ts - forecast_times[-1]).total_seconds())/60 <= 5 else None
        before, after = forecast_times[i-1], forecast_times[i]
        bdiff = abs((ts - before).total_seconds())/60
        adiff = abs((after - ts).total_seconds())/60
        return forecast_knots[i-1] if bdiff <= adiff and bdiff <= 5 else (forecast_knots[i] if adiff <= 5 else None)

    # merge actual & predicted by nearest time
    merged = []
    for p in actual_points:
        ts = datetime.datetime.fromtimestamp(p["x"], tz=datetime.timezone.utc).astimezone(bris)
        merged.append({
            "x": ts.strftime("%H:%M"),
            "actual": p["y"] * 0.539957,
            "predicted": find_nearest_forecast(ts)
        })

    # save to analysis bucket
    out = {
        "metadata": {
            "title": "Gold Coast Seaway Wind Data",
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
