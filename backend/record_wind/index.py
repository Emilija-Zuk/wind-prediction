import json, boto3, os, requests, datetime

s3 = boto3.resource("s3")
BASE_URL = "https://api.willyweather.com.au/v2/"

def lambda_handler(event, context):
    api_key = os.environ["WW_API_KEY"]
    yesterday = datetime.datetime.now() - datetime.timedelta(days=1)
    date_str = yesterday.strftime("%Y-%m-%d")

    # daily observations
    obs = "wind,pressure,wind-gust,rainfall,temperature,apparent-temperature,cloud,delta-t,dew-point,humidity"
    stations = [
        ["GC","18591"], ["COOLLY","18118"], ["HOPE","39817"],
        ["BANANA","39818"], ["CAPE","30280"], ["BYRON_MAIN","19017"]
    ]
    for name, sid in stations:
        fetch_and_store(
            f"{BASE_URL}{api_key}/locations/{sid}/weather.json",
            {"observationalGraphs": obs, "startDate": date_str},
            "record-wind",
            f"{name}{date_str}.json"
        )

    # forecast for GC
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    fetch_and_store(
        f"{BASE_URL}{api_key}/locations/18591/weather.json",
        {"forecasts": "wind"},
        "forecast-wind",
        f"GC{today}.json"
    )

    return {"statusCode": 200, "body": json.dumps("all the files are created")}

def fetch_and_store(url, params, bucket, file_name):
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    path = f"/tmp/{file_name}"
    with open(path, "wb") as f:
        f.write(r.content)
    s3.meta.client.upload_file(path, bucket, file_name)
