
resource "aws_cloudwatch_event_rule" "record_wind_daily" {
  name                = "record-wind-daily"
  schedule_expression = "cron(5 14 * * ? *)"   # 00:05 brisbane time   
  description         = "Invoke record_wind Lambda every day at 00:05am Brisbane time"
}

resource "aws_cloudwatch_event_target" "record_wind_daily" {
  rule      = aws_cloudwatch_event_rule.record_wind_daily.name
  target_id = "record-wind-lambda"
  arn       = aws_lambda_function.record_wind.arn
}

resource "aws_lambda_permission" "allow_eventbridge_record_wind" {
  statement_id  = "AllowEventBridgeInvokeRecordWind"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.record_wind.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.record_wind_daily.arn
}





resource "aws_cloudwatch_event_rule" "analysis_builder_daily" {
  name                = "analysis-builder-daily"
  schedule_expression = "cron(15 14 * * ? *)" # 00:15 Brisbane (AEST/AEDT)
  description         = "Invoke analysis_builder Lambda every day at 00:15 Brisbane time"
}

resource "aws_cloudwatch_event_target" "analysis_builder_daily" {
  rule      = aws_cloudwatch_event_rule.analysis_builder_daily.name
  target_id = "analysis-builder-lambda"
  arn       = aws_lambda_function.analysis_builder.arn
}

resource "aws_lambda_permission" "allow_eventbridge_analysis_builder" {
  statement_id  = "AllowEventBridgeInvokeAnalysisBuilder"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.analysis_builder.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.analysis_builder_daily.arn
}
