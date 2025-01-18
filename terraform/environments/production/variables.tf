variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "platform"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "ecr_repository_url" {
  description = "ECR repository URL"
  type        = string
  default     = "446362978848.dkr.ecr.eu-central-1.amazonaws.com/platform-api"
}

variable "domain_name" {
  description = "Domain name for the API endpoint"
  type        = string
  default     = "api.platform.notablenomads.com"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"  # Production CIDR
}

variable "private_subnet_cidr" {
  description = "CIDR block for private subnet"
  type        = string
  default     = "10.0.2.0/24"  # Production private subnet
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.0.0/24"  # Production public subnet
}

variable "ssm_prefix" {
  description = "SSM parameter prefix for secrets"
  type        = string
  default     = "/platform/production"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.nano"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "error"
}

variable "cors_enabled_domains" {
  description = "CORS enabled domains"
  type        = string
  default     = "*.notablenomads.com,notablenomads.com"
} 