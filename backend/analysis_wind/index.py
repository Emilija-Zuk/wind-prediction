import json
import boto3
import datetime
from zoneinfo import ZoneInfo

s3 = boto3.client("s3")

def lambda_handler(event, context):
    """Return combined analysis data for yesterday and today."""

    bris = ZoneInfo("Australia/Brisbane")
    now  = datetime.datetime.now(bris)

    today     = now.strftime("%Y-%m-%d")
    yesterday = (now - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    bucket = "analysis-wind"
    files  = [f"GC{yesterday}.json", f"GC{today}.json"]

    combined = {}

    for key in files:
        try:
            obj  = s3.get_object(Bucket=bucket, Key=key)
            data = json.loads(obj["Body"].read())
            combined[key] = data
        except s3.exceptions.NoSuchKey:
            # Skip if the file does not exist yet
            combined[key] = {"error": "file not found"}

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
        },
        "body": json.dumps(combined)
    }
