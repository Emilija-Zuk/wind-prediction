import json
import os
import datetime
import boto3
from zoneinfo import ZoneInfo

s3 = boto3.client("s3")
bucket_name = "forecast-wind"

def lambda_handler(event, context):
    # find today's file (e.g. GC2025-09-23.json)
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    key = f"GC{today}.json"

    # get the object from S3
    obj = s3.get_object(Bucket=bucket_name, Key=key)
    raw = json.loads(obj["Body"].read())

    bris = ZoneInfo("Australia/Brisbane")
    now = datetime.datetime.now(bris)
    start_hour = (now.replace(minute=0, second=0, microsecond=0)
              + datetime.timedelta(hours=1 if now.minute > 0 or now.second > 0 else 0))

    cutoff = start_hour + datetime.timedelta(hours=12)

    # collect hourly points
    points = []
    for day in raw["forecasts"]["wind"]["days"]:
        for e in day["entries"]:
            ts = datetime.datetime.fromisoformat(e["dateTime"])
            ts = ts.astimezone(bris) if ts.tzinfo else ts.replace(tzinfo=bris)
            if start_hour <= ts <= cutoff:
                points.append({
                    "ts": ts,
                    "wind_knots": e["speed"] * 0.539957,
                    "direction_degrees": e.get("direction"),
                    "direction_text": e.get("directionText")
                })

    points.sort(key=lambda p: p["ts"])

    # interpolate to 10-minute steps
    filled = []
    for a, b in zip(points, points[1:]):
        filled.append({
            "x": a["ts"].strftime("%H:%M"),
            "wind_knots": a["wind_knots"],
            "direction_degrees": a["direction_degrees"],
            "direction_text": a["direction_text"]
        })

        t = a["ts"]
        while (t + datetime.timedelta(minutes=10)) < b["ts"]:
            t += datetime.timedelta(minutes=10)
            frac = (t - a["ts"]).total_seconds() / (b["ts"] - a["ts"]).total_seconds()
            filled.append({
                "x": t.strftime("%H:%M"),
                "wind_knots": a["wind_knots"] + frac * (b["wind_knots"] - a["wind_knots"]),
                "direction_degrees": a["direction_degrees"],
                "direction_text": a["direction_text"]
            })

    if points:
        last = points[-1]
        filled.append({
            "x": last["ts"].strftime("%H:%M"),
            "wind_knots": last["wind_knots"],
            "direction_degrees": last["direction_degrees"],
            "direction_text": last["direction_text"]
        })

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Content-Type": "application/json"
        },
        "body": json.dumps({
            "metadata": {
                "title": "Gold Coast Seaway Forecast (next 12 h, 10-min steps)",
                "unit": "knots",
                "date": now.strftime("%Y-%m-%d")
            },
            "data": filled
        })
    }
