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
}

variable "domain_name" {
  description = "Domain name for the API"
  type        = string
  default     = "api.platform.notablenomads.com"  # Production domain
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