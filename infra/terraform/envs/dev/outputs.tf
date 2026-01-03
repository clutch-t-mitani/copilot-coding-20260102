output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

# Outputs will be added as modules are implemented
# Example outputs:

# output "user_service_function_arn" {
#   description = "User Service Lambda function ARN"
#   value       = module.user_service.function_arn
# }

# output "api_gateway_url" {
#   description = "API Gateway URL"
#   value       = module.api_gateway.api_url
# }
