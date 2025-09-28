
data "archive_file" "analysis_builder" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/analysis_builder/"
  output_path = "${path.module}/../backend/analysis_builder/lambda1.zip"
}


resource "aws_lambda_function" "analysis_builder" {
  filename         = "${path.module}/../backend/analysis_builder/lambda1.zip"
  function_name    = "analysis_builder"
  role             = aws_iam_role.iam_for_lambda.arn
  handler          = "index.lambda_handler"     
  runtime          = "python3.12"
  source_code_hash = data.archive_file.analysis_builder.output_base64sha256


  timeout      = 30     # seconds 
  memory_size  = 256    

  environment {
    variables = {
      WW_API_KEY = var.ww_api_key
    }
  }
}

data "aws_iam_policy_document" "analysis_builder_s3" {
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl"
    ]
    resources = [
      "${aws_s3_bucket.analysis_wind.arn}/*"
    ]
  }
}

resource "aws_iam_role_policy" "analysis_builder_s3" {
  name   = "analysis-builder-s3-access"
  role   = aws_iam_role.iam_for_lambda.id
  policy = data.aws_iam_policy_document.analysis_builder_s3.json
}

data "aws_iam_policy_document" "analysis_builder_s3_read" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.record_wind.arn,
      "${aws_s3_bucket.record_wind.arn}/*",
      aws_s3_bucket.forecast_wind.arn,
      "${aws_s3_bucket.forecast_wind.arn}/*"
    ]
  }
}

resource "aws_iam_role_policy" "analysis_builder_s3_read" {
  name   = "analysis-builder-s3-read"
  role   = aws_iam_role.iam_for_lambda.id
  policy = data.aws_iam_policy_document.analysis_builder_s3_read.json
}