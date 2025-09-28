import json, boto3, os, requests, datetime
from zoneinfo import ZoneInfo

s3 = boto3.resource("s3")
BASE_URL = "https://api.willyweather.com.au/v2/"

def lambda_handler(event, context):
    api_key   = os.environ["WW_API_KEY"]
    bris      = ZoneInfo("Australia/Brisbane")
    now_bris  = datetime.datetime.now(bris)
    yesterday = now_bris - datetime.timedelta(days=1)
    two_days_ago = now_bris - datetime.timedelta(days=2)

    start_str = two_days_ago.strftime("%Y-%m-%d")   # ask for two days back
    ydate     = yesterday.strftime("%Y-%m-%d")      # we will save this date

    obs = "wind,pressure,wind-gust,rainfall,temperature,apparent-temperature,cloud,delta-t,dew-point,humidity"
    stations = [
        ["GC","18591"], ["COOLLY","18118"], ["HOPE","39817"],
        ["BANANA","39818"], ["CAPE","30280"], ["BYRON_MAIN","19017"]
    ]

    # fetch and trim each station
    for name, sid in stations:
        url = f"{BASE_URL}{api_key}/locations/{sid}/weather.json"
        params = {"observationalGraphs": obs, "startDate": start_str}  # ✅ no endDate
        r = requests.get(url, params=params, timeout=15)
        r.raise_for_status()
        raw = r.json()

        # keep only yesterday
        start_bris = datetime.datetime.strptime(ydate, "%Y-%m-%d").replace(tzinfo=bris)
        end_bris   = start_bris + datetime.timedelta(days=1)

        for graph in raw["observationalGraphs"].values():
            for series in graph["dataConfig"]["series"]["groups"]:
                series["points"] = [
                    p for p in series["points"]
                    if start_bris <= datetime.datetime.fromtimestamp(
                        p["x"], tz=datetime.timezone.utc).astimezone(bris) < end_bris
                ]

        save_to_s3(raw, "record-wind", f"{name}{ydate}.json")

    # forecast 
    fetch_and_store(
        f"{BASE_URL}{api_key}/locations/18591/weather.json",
        {"forecasts": "wind", "days": 2},
        "forecast-wind",
        f"GC{now_bris.strftime('%Y-%m-%d')}.json"
    )

    return {"statusCode": 200, "body": f"full-day {ydate} saved"}

def fetch_and_store(url, params, bucket, key):
    r = requests.get(url, params=params, timeout=15)
    r.raise_for_status()
    save_to_s3(r.json(), bucket, key)

def save_to_s3(data, bucket, key):
    tmp = f"/tmp/{key}"
    with open(tmp, "w") as f:
        json.dump(data, f)
    s3.meta.client.upload_file(tmp, bucket, key)
