import json, boto3, os, requests, datetime
from zoneinfo import ZoneInfo

s3 = boto3.resource("s3")
BASE_URL = "https://api.willyweather.com.au/v2/"

def lambda_handler(event, context):
    api_key = os.environ["WW_API_KEY"]

    # Brisbane time for defining yesterday today
    bris = ZoneInfo("Australia/Brisbane")
    now_bris = datetime.datetime.now(bris)
    yesterday = (now_bris - datetime.timedelta(days=1)).date()
    date_str = yesterday.strftime("%Y-%m-%d")
    today = now_bris.date()

    obs = "wind,pressure,wind-gust,rainfall,temperature,apparent-temperature,cloud,delta-t,dew-point,humidity"
    stations = [
        ["GC","18591"], ["COOLLY","18118"], ["HOPE","39817"],
        ["BANANA","39818"], ["CAPE","30280"], ["BYRON_MAIN","19017"]
    ]
    for name, sid in stations:
        filter_and_store(
            f"{BASE_URL}{api_key}/locations/{sid}/weather.json",
            {"observationalGraphs": obs, "startDate": date_str},
            "record-wind",
            f"{name}{date_str}.json",
            yesterday
        )

    # forecast 
    fetch_and_store(
        f"{BASE_URL}{api_key}/locations/18591/weather.json",
        {"forecasts": "wind", "days": 2},
        "forecast-wind",
        f"GC{today}.json"
    )

    return {"statusCode": 200, "body": json.dumps("all the files are created")}


def filter_and_store(url, params, bucket, file_name, target_date):
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()

    # yesterday 00:00 - today 00:00 Brisbane date, but compare as UTC because of willy weather api bug
    start = datetime.datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
    end   = start + datetime.timedelta(days=1)

    for graph_name, graph in data.get("observationalGraphs", {}).items():
        for group in graph.get("dataConfig", {}).get("series", {}).get("groups", []):
            filtered_points = []
            for pt in group.get("points", []):
                # Treat timestamps as UTC but actually Brisbane-local
                dt = datetime.datetime.utcfromtimestamp(pt["x"])
                if start <= dt < end:
                    filtered_points.append(pt)
            group["points"] = filtered_points

    # save filtered JSON
    s3.Object(bucket, file_name).put(
        Body=json.dumps(data),
        ContentType="application/json"
    )


def fetch_and_store(url, params, bucket, file_name):
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    s3.Object(bucket, file_name).put(
        Body=r.content,
        ContentType="application/json"
    )
