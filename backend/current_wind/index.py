import json
import os
import datetime
import requests   # must be packaged
import boto3
from zoneinfo import ZoneInfo

s3 = boto3.resource("s3") 

def lambda_handler(event, context):
    """Return last 12 hours of wind data from WillyWeather."""
    api_key = os.environ["WW_API_KEY"]
    station_id = "18591"  # Gold Coast Seaway
    obs = "wind,wind-gust"

    url = f"https://api.willyweather.com.au/v2/{api_key}/locations/{station_id}/weather.json"
    params = {"observationalGraphs": obs}

    # Fetch live data
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    raw = r.json()

    # save raw data to S3
    bris = ZoneInfo("Australia/Brisbane")
    now_bris = datetime.datetime.now(bris)
    file_name = f"GC{now_bris.strftime('%Y-%m-%d_%H-%M')}.json"
    tmp_path = f"/tmp/{file_name}"
    with open(tmp_path, "w") as f:
        json.dump(raw, f)
    s3.meta.client.upload_file(tmp_path, "current-wind", file_name)

    # Extract and filter the last 12 hours
    wind_points = raw["observationalGraphs"]["wind"]["dataConfig"]["series"]["groups"][0]["points"]
    gust_points = raw["observationalGraphs"]["wind-gust"]["dataConfig"]["series"]["groups"][0]["points"]

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    cutoff = now_utc - datetime.timedelta(hours=12)

    graph_data = []
    for i, p in enumerate(wind_points):
        dt = datetime.datetime.fromtimestamp(p["x"], tz=datetime.timezone.utc)
        if dt < cutoff:
            continue
        gust_val = gust_points[i]["y"] * 0.539957 if i < len(gust_points) else None

        graph_data.append({
            "x": dt.strftime("%H:%M"),
            "wind_knots": p["y"] * 0.539957,
            "direction_degrees": p.get("direction"),
            "direction_text": p.get("directionText"),
            "wind_gust_knots": gust_val
        })

    final_output = {
        "metadata": {
            "title": f"{raw.get('location', {}).get('name', 'Gold Coast Seaway')} Wind Data",
            "unit": "knots",
            "date": now_utc.strftime("%Y-%m-%d")
        },
        "data": graph_data
    }

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Content-Type": "application/json",
        },
        "body": json.dumps(final_output)
    }
