import json, os, datetime, requests
from zoneinfo import ZoneInfo

def lambda_handler(event, context):
    api_key = os.environ["WW_API_KEY"]
    station_id = "18591"

    url = f"https://api.willyweather.com.au/v2/{api_key}/locations/{station_id}/weather.json"
    params = {"forecasts": "wind"}

    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    raw = r.json()

    bris = ZoneInfo("Australia/Brisbane")
    now = datetime.datetime.now(bris)
    cutoff = now + datetime.timedelta(hours=12)

    # collect hourly points
    points = []
    for day in raw["forecasts"]["wind"]["days"]:
        for e in day["entries"]:
            ts = datetime.datetime.fromisoformat(e["dateTime"])
            ts = ts.astimezone(bris) if ts.tzinfo else ts.replace(tzinfo=bris)
            if now <= ts <= cutoff:
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
        # add point a
        filled.append({
            "x": a["ts"].strftime("%H:%M"),
            "wind_knots": a["wind_knots"],
            "direction_degrees": a["direction_degrees"],
            "direction_text": a["direction_text"]
        })

        # fill the next 50 minutes in 10-minute steps
        t = a["ts"]
        while (t + datetime.timedelta(minutes=10)) < b["ts"]:
            t += datetime.timedelta(minutes=10)
            frac = (t - a["ts"]).total_seconds() / (b["ts"] - a["ts"]).total_seconds()
            filled.append({
                "x": t.strftime("%H:%M"),
                "wind_knots": a["wind_knots"] + frac * (b["wind_knots"] - a["wind_knots"]),
                "direction_degrees": a["direction_degrees"],   # simple: hold direction
                "direction_text": a["direction_text"]
            })

    # add final hourly point
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
