
data "archive_file" "analysis_wind" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/analysis_wind/"
  output_path = "${path.module}/../backend/analysis_wind/lambda1.zip"
}


resource "aws_lambda_function" "analysis_wind" {
  filename         = "${path.module}/../backend/analysis_wind/lambda1.zip"
  function_name    = "analysis_wind"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.lambda_handler"     
  runtime          = "python3.12"
  source_code_hash = data.archive_file.analysis_wind.output_base64sha256


  timeout      = 30     # seconds 
  memory_size  = 256    

  environment {
    variables = {
      WW_API_KEY = var.ww_api_key
    }
  }
}


data "aws_iam_policy_document" "analysis_wind_s3_read" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.analysis_wind.arn,
      "${aws_s3_bucket.analysis_wind.arn}/*",

    ]
  }
}

resource "aws_iam_role_policy" "analysis_wind_s3_read" {
  name   = "analysis-wind-s3-read"
  role   = aws_iam_role.iam_for_lambda.id
  policy = data.aws_iam_policy_document.analysis_wind_s3_read.json
}