# CREATE API AND A PATH /submit

resource "aws_api_gateway_rest_api" "my_api" {
  name        = "currentWind"
  description = "API created in Terraform"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "submit" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "submit"
}

resource "aws_api_gateway_method" "submit_get" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.submit.id
  http_method   = "GET"
  authorization = "NONE"
  api_key_required = true

}



# LAMBDA INTEGRATION
resource "aws_api_gateway_integration" "submit_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.my_api.id
  resource_id             = aws_api_gateway_resource.submit.id
  http_method             = aws_api_gateway_method.submit_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.REGION}:lambda:path/2015-03-31/functions/${aws_lambda_function.lambda1.arn}/invocations"
}



# GET SETUP
resource "aws_api_gateway_method_response" "submit_get_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.submit.id
  http_method = aws_api_gateway_method.submit_get.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# OPTIONS
resource "aws_api_gateway_method" "submit_options" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.submit.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "submit_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.submit.id
  http_method = aws_api_gateway_method.submit_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_method_response" "submit_options_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.submit.id
  http_method = aws_api_gateway_method.submit_options.http_method
  status_code = 200

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true,
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

# GET integration response – only allow origin
resource "aws_api_gateway_integration_response" "lambda_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.submit.id
  http_method = aws_api_gateway_method.submit_get.http_method
  status_code = aws_api_gateway_method_response.submit_get_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.submit_get_integration]
}

resource "aws_api_gateway_integration_response" "submit_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.submit.id
  http_method = aws_api_gateway_method.submit_options.http_method
  status_code = aws_api_gateway_method_response.submit_options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'",
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET'"
  }

  depends_on = [aws_api_gateway_integration.submit_options_integration]
}

# new lambda
resource "aws_lambda_permission" "allow_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda1.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.my_api.execution_arn}/*/*"
}

# DEPLOYMENT
resource "aws_api_gateway_deployment" "my_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id

  triggers = {
    redeploy = "${timestamp()}"
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_method.submit_get,
    aws_api_gateway_method.submit_options,
    aws_api_gateway_integration.submit_get_integration,
    aws_api_gateway_integration.submit_options_integration,
    aws_api_gateway_method_response.submit_get_response,
    aws_api_gateway_method_response.submit_options_response,

        # add forecast dependencies
    aws_api_gateway_method.forecast_get,
    aws_api_gateway_method.forecast_options,
    aws_api_gateway_integration.forecast_integration,
    aws_api_gateway_integration.forecast_options_integration,
    aws_api_gateway_method_response.forecast_get_response,
    aws_api_gateway_method_response.forecast_options_response,

      aws_api_gateway_method.analysis_get,
  aws_api_gateway_method.analysis_options,
  aws_api_gateway_integration.analysis_integration,
  aws_api_gateway_integration.analysis_options_integration,
  aws_api_gateway_method_response.analysis_get_response,
  aws_api_gateway_method_response.analysis_options_response
  ]
}

resource "aws_api_gateway_stage" "my_stage" {
  deployment_id = aws_api_gateway_deployment.my_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  stage_name    = "test1"
}

output "lambda_function_uri" {
  value       = aws_lambda_function.lambda1.invoke_arn
  description = "Invoke URI for current_wind Lambda."
}

resource "local_file" "api_id_file" {
  content  = aws_api_gateway_rest_api.my_api.id
  filename = "${path.module}/api_id.txt"
}

# Create an API key
resource "aws_api_gateway_api_key" "my_key" {
  name      = "currentWindKey"
  enabled   = true
  value     = random_string.api_key.result
}

# Create a usage plan and attach the API
resource "aws_api_gateway_usage_plan" "my_usage_plan" {
  name        = "currentWindPlan"
  description = "Limit requests and require key"

  api_stages {
    api_id = aws_api_gateway_rest_api.my_api.id
    stage  = aws_api_gateway_stage.my_stage.stage_name
  }

  throttle_settings {
    burst_limit = 100
    rate_limit  = 1000
  }

  quota_settings {
    limit  = 1000
    period = "DAY"
  }
}

# Link the key to the plan
resource "aws_api_gateway_usage_plan_key" "my_plan_key" {
  key_id        = aws_api_gateway_api_key.my_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.my_usage_plan.id
}

# Add a random string to generate a secret value
resource "random_string" "api_key" {
  length  = 32
  special = false
}

output "api_key_value" {
  value       = aws_api_gateway_api_key.my_key.value
  description = "API key to include in x-api-key header"
  sensitive   = true
}

# terraform output api_key_value


resource "aws_api_gateway_resource" "forecast" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "forecast"
}

resource "aws_api_gateway_method" "forecast_get" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.forecast.id
  http_method   = "GET"
  authorization = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "forecast_integration" {
  rest_api_id             = aws_api_gateway_rest_api.my_api.id
  resource_id             = aws_api_gateway_resource.forecast.id
  http_method             = aws_api_gateway_method.forecast_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.REGION}:lambda:path/2015-03-31/functions/${aws_lambda_function.forecast_lambda.arn}/invocations"
}

resource "aws_api_gateway_method" "forecast_options" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.forecast.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "forecast_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.forecast.id
  http_method = aws_api_gateway_method.forecast_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_method_response" "forecast_options_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.forecast.id
  http_method = aws_api_gateway_method.forecast_options.http_method
  status_code = 200

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true,
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "forecast_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.forecast.id
  http_method = aws_api_gateway_method.forecast_options.http_method
  status_code = aws_api_gateway_method_response.forecast_options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'",
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET'"
  }

  depends_on = [aws_api_gateway_integration.forecast_options_integration]
}

resource "aws_api_gateway_method_response" "forecast_get_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.forecast.id
  http_method = aws_api_gateway_method.forecast_get.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "forecast_get_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.forecast.id
  http_method = aws_api_gateway_method.forecast_get.http_method
  status_code = aws_api_gateway_method_response.forecast_get_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.forecast_integration]
}



resource "aws_api_gateway_resource" "analysis" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "analysis"
}

resource "aws_api_gateway_method" "analysis_get" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.analysis.id
  http_method   = "GET"
  authorization = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "analysis_integration" {
  rest_api_id             = aws_api_gateway_rest_api.my_api.id
  resource_id             = aws_api_gateway_resource.analysis.id
  http_method             = aws_api_gateway_method.analysis_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.REGION}:lambda:path/2015-03-31/functions/${aws_lambda_function.analysis_wind.arn}/invocations"
}

resource "aws_api_gateway_method_response" "analysis_get_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.analysis.id
  http_method = aws_api_gateway_method.analysis_get.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "analysis_get_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.analysis.id
  http_method = aws_api_gateway_method.analysis_get.http_method
  status_code = aws_api_gateway_method_response.analysis_get_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }
  depends_on = [aws_api_gateway_integration.analysis_integration]
}

# OPTIONS for CORS
resource "aws_api_gateway_method" "analysis_options" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.analysis.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "analysis_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.analysis.id
  http_method = aws_api_gateway_method.analysis_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_method_response" "analysis_options_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.analysis.id
  http_method = aws_api_gateway_method.analysis_options.http_method
  status_code = 200
  response_models = {
    "application/json" = "Empty"
  }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true,
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "analysis_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.analysis.id
  http_method = aws_api_gateway_method.analysis_options.http_method
  status_code = aws_api_gateway_method_response.analysis_options_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'",
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,GET'"
  }
  depends_on = [aws_api_gateway_integration.analysis_options_integration]
}

# Allow API Gateway to invoke lambda
resource "aws_lambda_permission" "allow_api_gateway_analysis" {
  statement_id  = "AllowAPIGatewayInvokeAnalysis"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.analysis_wind.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.my_api.execution_arn}/*/*"
}


