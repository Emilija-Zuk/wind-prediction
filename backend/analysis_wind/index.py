import json
import boto3
import re
from datetime import datetime

s3 = boto3.client("s3")
ANALYSIS_BUCKET = "analysis-wind"

def lambda_handler(event, context):
    params = event.get("queryStringParameters") or {}
    graph_type = params.get("type", "line")


    if graph_type == "line":
        return build_line_graph(params)
    elif graph_type == "bar":
        return build_bar_graph(params)
    elif graph_type == "scatter":
        print("Scatter graph not implemented yet")
        return _empty_response()
    else:
        return _error_response(f"Unknown graph type: {graph_type}")


def build_line_graph(params):
    start_str = params.get("start")
    end_str = params.get("end")
  
    start_date = datetime.strptime(start_str, "%Y-%m-%d").date() if start_str else None
    end_date = datetime.strptime(end_str, "%Y-%m-%d").date() if end_str else None

    resp = s3.list_objects_v2(Bucket=ANALYSIS_BUCKET)
    if "Contents" not in resp:
        print("No files found in bucket")
        return _empty_response()

    all_data = []
    dates = []


    for obj in sorted(resp["Contents"], key=lambda x: x["Key"]):
        key = obj["Key"]

        # extract date YYYY-MM-DD 
        match = re.search(r"\d{4}-\d{2}-\d{2}", key)
        if not match:
            print(f"Could not extract date from key: {key}")
            continue

        file_date = datetime.strptime(match.group(0), "%Y-%m-%d").date()


        if start_date and file_date < start_date:
            print(f"  Skipping {key} (before start)")
            continue
        if end_date and file_date > end_date:
            print(f"  Skipping {key} (after end)")
            continue

        file_obj = s3.get_object(Bucket=ANALYSIS_BUCKET, Key=key)
        file_raw = json.loads(file_obj["Body"].read())

        data_count = len(file_raw.get("data", []))

        all_data.extend(file_raw.get("data", []))
        dates.append(str(file_date))

    final_output = {
        "metadata": {
            "station": "Gold Coast Seaway",
            "unit": "knots",
            "dates": dates,
            "graph_type": "line"
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


def _empty_response():
    return {
        "statusCode": 200,
        "body": json.dumps({"metadata": {}, "data": []}),
        "headers": {"Content-Type": "application/json"}
    }


def _error_response(message):
    return {
        "statusCode": 400,
        "body": json.dumps({"error": message}),
        "headers": {"Content-Type": "application/json"}
    }

def build_bar_graph(params):
    """
    Reads analysis-wind/GCdaily.json and returns daily metrics
    filtered by start/end (YYYY-MM-DD). Inclusive on both ends.
    """
    start_str = params.get("start")
    end_str = params.get("end")

    start_date = datetime.strptime(start_str, "%Y-%m-%d").date() if start_str else None
    end_date = datetime.strptime(end_str, "%Y-%m-%d").date() if end_str else None

    # Load GCdaily.json
    try:
        obj = s3.get_object(Bucket=ANALYSIS_BUCKET, Key="GCdaily.json")
        body = json.loads(obj["Body"].read())
    except Exception as e:
        print(f"GCdaily.json not found or unreadable: {e}")
        return _empty_response()

    station = body.get("station", "Gold Coast Seaway")
    unit = body.get("unit", "knots")
    daily = body.get("daily", [])

    # filter rows
    data = []
    for item in daily:
        dstr = item.get("date")
        if not dstr:
            continue
        try:
            d = datetime.strptime(dstr, "%Y-%m-%d").date()
        except Exception:
            continue

        if start_date and d < start_date:
            continue
        if end_date and d > end_date:
            continue

        # provide full metrics
        data.append({
            "date": dstr,
            "n": item.get("n"),
            "coverage": item.get("coverage"),
            "mae": item.get("mae"),
            "rmse": item.get("rmse"),
            "bias": item.get("bias"),
            "smape": item.get("smape"),
            "mean_actual": item.get("mean_actual"),
            "mean_predicted": item.get("mean_predicted"),
        })

    # ascending date order
    data.sort(key=lambda r: r["date"])

    final_output = {
        "metadata": {
            "station": station,
            "unit": unit,
            "graph_type": "bar",
            "dates": [r["date"] for r in data]
        },
        "data": data
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
