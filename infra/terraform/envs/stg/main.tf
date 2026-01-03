# Main Terraform configuration for Mini-SNS staging environment
# This is the entry point for the infrastructure

# Placeholder for module imports
# Uncomment and configure modules as they are developed

# module "user_service" {
#   source = "../../modules/user-service"
#   
#   project_name = var.project_name
#   environment  = var.environment
#   aws_region   = var.aws_region
# }

# module "post_service" {
#   source = "../../modules/post-service"
#   
#   project_name = var.project_name
#   environment  = var.environment
#   aws_region   = var.aws_region
# }

# module "social_service" {
#   source = "../../modules/social-service"
#   
#   project_name = var.project_name
#   environment  = var.environment
#   aws_region   = var.aws_region
# }

# module "timeline_service" {
#   source = "../../modules/timeline-service"
#   
#   project_name = var.project_name
#   environment  = var.environment
#   aws_region   = var.aws_region
# }

# Shared infrastructure (uncomment when modules are ready)
# module "api_gateway" {
#   source = "../../modules/api-gateway"
#   
#   project_name = var.project_name
#   environment  = var.environment
# }

# module "eventbridge" {
#   source = "../../modules/eventbridge"
#   
#   project_name = var.project_name
#   environment  = var.environment
# }

# module "cognito" {
#   source = "../../modules/cognito"
#   
#   project_name = var.project_name
#   environment  = var.environment
# }
