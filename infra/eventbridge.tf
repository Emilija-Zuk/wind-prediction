# EventBridge rule: run every day at 1:00 AM Brisbane time (AEST/AEDT)
resource "aws_cloudwatch_event_rule" "record_wind_daily" {
  name                = "record-wind-daily"
  schedule_expression = "cron(0 15 * * ? *)"    # 1 AM Brisbane = 15:00 UTC
  description         = "Invoke record_wind Lambda every day at 1am Brisbane time"
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
