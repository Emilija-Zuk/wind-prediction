variable "ww_api_key" {
  type        = string
  description = "WillyWeather API key"
  sensitive   = true
}


data "archive_file" "lambda1" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/current_wind/"
  output_path = "${path.module}/../backend/current_wind/lambda1.zip"
}

data "archive_file" "forecast_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/forecast_wind/"
  output_path = "${path.module}/../backend/forecast_wind/lambda1.zip"
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}


resource "aws_iam_role" "iam_for_lambda" {
  name               = "iam_for_lambda"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_logging" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


resource "aws_lambda_function" "lambda1" {

  filename      = "${path.module}/../backend/current_wind/lambda1.zip"
  function_name = "current_wind"
  role          = aws_iam_role.iam_for_lambda.arn
  
  handler       = "index.lambda_handler" # lambda_handler is specified in index.py. function entry

  runtime         = "python3.12"

  source_code_hash = data.archive_file.lambda1.output_base64sha256

#   lifecycle {
#   ignore_changes = [filename, source_code_hash]
# }

  environment {
    variables = {
      WW_API_KEY = var.ww_api_key
    }
  }
} 

resource "aws_lambda_function" "forecast_lambda" {
  filename         = "${path.module}/../backend/forecast_wind/lambda1.zip"
  function_name    = "forecast_wind"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.lambda_handler"
  runtime          = "python3.12"
  source_code_hash = data.archive_file.forecast_lambda.output_base64sha256
  environment {
    variables = {
      WW_API_KEY = var.ww_api_key
    }
  }
}

resource "aws_lambda_permission" "allow_api_gateway_forecast" {
  statement_id  = "AllowAPIGatewayInvokeForecast"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.forecast_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.my_api.execution_arn}/*/*"
}





data "aws_iam_policy_document" "forecast_lambda_s3_read" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "${aws_s3_bucket.forecast_wind.arn}/*"
    ]
  }
}

resource "aws_iam_role_policy" "forecast_lambda_s3_read" {
  name   = "forecast-lambda-s3-read"
  role   = aws_iam_role.iam_for_lambda.id
  policy = data.aws_iam_policy_document.forecast_lambda_s3_read.json
}



# allow lambda1 to write JSON to bucket
data "aws_iam_policy_document" "record_wind_s3_write" {
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject"
    ]
    resources = [
      "${aws_s3_bucket.record_wind.arn}/*"
    ]
  }
}

resource "aws_iam_role_policy" "record_wind_s3_write" {
  name   = "record-wind-s3-write"
  role   = aws_iam_role.iam_for_lambda.id
  policy = data.aws_iam_policy_document.record_wind_s3_write.json
}









