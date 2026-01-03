variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "mini-sns"
}

variable "environment" {
  description = "Environment name (dev, stg, prod)"
  type        = string
  default     = "stg"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-northeast-1"
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
