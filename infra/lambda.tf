data "archive_file" "lambda1" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/current_wind/"
  output_path = "${path.module}/../backend/current_wind/lambda1.zip"
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
      foo = "bar"
    }
  }
} 



















