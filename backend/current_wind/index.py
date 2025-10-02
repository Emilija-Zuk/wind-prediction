import json, os, datetime, requests, boto3
from zoneinfo import ZoneInfo
from bisect import bisect_left

s3 = boto3.resource("s3")
BASE_URL = "https://api.willyweather.com.au/v2/"

def lambda_handler(event, context):
    api_key = os.environ["WW_API_KEY"]

    bris = ZoneInfo("Australia/Brisbane")
    now_bris = datetime.datetime.now(bris)
    today = now_bris.date()
    today_str = today.strftime("%Y-%m-%d")

    # call api
    obs = "wind,pressure,wind-gust,rainfall,temperature,apparent-temperature,cloud,delta-t,dew-point,humidity"
    station_id = "18591"   # Gold Coast Seaway
    url = f"{BASE_URL}{api_key}/locations/{station_id}/weather.json"
    params = {"observationalGraphs": obs, "startDate": today_str}

    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()

    # filter and treat utc as local time
    start = datetime.datetime(today.year, today.month, today.day, 0, 0, 0)
    end   = start + datetime.timedelta(days=1)

    for graph_name, graph in data.get("observationalGraphs", {}).items():
        for group in graph.get("dataConfig", {}).get("series", {}).get("groups", []):
            filtered_points = []
            for pt in group.get("points", []):
                dt = datetime.datetime.utcfromtimestamp(pt["x"])  # interpret as Brisbane local
                if start <= dt < end and dt <= now_bris.replace(tzinfo=None):
                    filtered_points.append(pt)
            group["points"] = filtered_points

    # save to s3
    out_key = f"GC{today_str}.json"
    s3.Object("record-wind", out_key).put(
        Body=json.dumps(data),
        ContentType="application/json"
    )


    #### CREATE TODAYS ANALYSIS FILE

  
    forecast_bucket = "forecast-wind"
    analysis_bucket = "analysis-wind"

    # use memory data
    actual_points = data["observationalGraphs"]["wind"]["dataConfig"]["series"]["groups"][0]["points"]

    # read forecast data  from s3
    forecast_key = f"GC{today_str}.json"
    forecast_obj = s3.meta.client.get_object(Bucket=forecast_bucket, Key=forecast_key)
    forecast_raw = json.loads(forecast_obj["Body"].read())

    start_bris = datetime.datetime(today.year, today.month, today.day, 0, 0, 0, tzinfo=bris)
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
                    "wind_knots": e["speed"] * 0.539957  # knots
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

    # merge actual vs forecast
    merged = []
    for p in actual_points:
        ts = datetime.datetime.utcfromtimestamp(p["x"]).replace(tzinfo=bris)  # treat as Brisbane local
        if not (start_bris <= ts < end_bris):
            continue
        merged.append({
            "time": ts.isoformat(),
            "actual": p["y"] * 0.539957,   #  knots
            "predicted": find_nearest_forecast(ts)
        })

    out = {
        "metadata": {
            "station": "Gold Coast Seaway",
            "unit": "knots",
            "date": today_str
        },
        "data": merged
    }

    out_key = f"GC{today_str}.json"
    s3.meta.client.put_object(
        Bucket=analysis_bucket,
        Key=out_key,
        Body=json.dumps(out),
        ContentType="application/json"
    )



    ######






    # return front end
    wind_points = data["observationalGraphs"]["wind"]["dataConfig"]["series"]["groups"][0]["points"]
    gust_points = data["observationalGraphs"]["wind-gust"]["dataConfig"]["series"]["groups"][0]["points"]

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
            "title": f"{data.get('location', {}).get('name', 'Gold Coast Seaway')} Wind Data",
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
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json",
        },
        "body": json.dumps(final_output)
    }
