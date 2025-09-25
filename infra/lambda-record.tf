# --- Package the code ---
data "archive_file" "record_wind" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/record_wind/"
  output_path = "${path.module}/../backend/record_wind/lambda1.zip"
}

# --- Lambda function ---
resource "aws_lambda_function" "record_wind" {
  filename         = "${path.module}/../backend/record_wind/lambda1.zip"
  function_name    = "record_wind"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.lambda_handler"     # keep same naming convention
  runtime          = "python3.12"
  source_code_hash = data.archive_file.record_wind.output_base64sha256

  timeout      = 30     # seconds 
  memory_size  = 256    

  environment {
    variables = {
      WW_API_KEY = var.ww_api_key
    }
  }
}

data "aws_iam_policy_document" "record_wind_s3" {
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl"
    ]
    resources = [
      "${aws_s3_bucket.record_wind.arn}/*",
      "${aws_s3_bucket.forecast_wind.arn}/*"
    ]
  }
}

resource "aws_iam_role_policy" "record_wind_s3" {
  name   = "record-wind-s3-access"
  role   = aws_iam_role.iam_for_lambda.id
  policy = data.aws_iam_policy_document.record_wind_s3.json
}
