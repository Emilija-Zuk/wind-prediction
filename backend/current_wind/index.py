import json
import os

def lambda_handler(event, context):
    # get file path inside the Lambda package
    file_path = os.path.join(os.path.dirname(__file__), "data.json")

    with open(file_path) as f:
        payload = json.load(f)

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(payload)
    }
