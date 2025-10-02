import json, boto3

s3 = boto3.client("s3")
ANALYSIS_BUCKET = "analysis-wind"

def lambda_handler(event, context):
    # list all objects in the bucket
    resp = s3.list_objects_v2(Bucket=ANALYSIS_BUCKET)
    if "Contents" not in resp:
        return {
            "statusCode": 200,
            "body": json.dumps({"metadata": {}, "data": []}),
            "headers": {"Content-Type": "application/json"}
        }

    all_data = []
    dates = []
    for obj in sorted(resp["Contents"], key=lambda x: x["Key"]):
        key = obj["Key"]
        # read each file
        file_obj = s3.get_object(Bucket=ANALYSIS_BUCKET, Key=key)
        file_raw = json.loads(file_obj["Body"].read())
        # merge data arrays
        all_data.extend(file_raw.get("data", []))
        dates.append(file_raw.get("metadata", {}).get("date"))

    # build combined output
    final_output = {
        "metadata": {
            "station": "Gold Coast Seaway",
            "unit": "knots",
            "dates": dates  # include which dates were merged
        },
        "data": all_data
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
