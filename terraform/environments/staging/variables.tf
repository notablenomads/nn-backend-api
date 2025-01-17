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
  default     = "staging"
}

variable "ecr_repository_url" {
  description = "ECR repository URL for the API container image"
  type        = string
}

variable "ssm_prefix" {
  description = "SSM parameter prefix for secrets"
  type        = string
  default     = "/platform/staging"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.1.0.0/16"  # Different CIDR for staging
}

variable "private_subnet_cidr" {
  description = "CIDR block for private subnet"
  type        = string
  default     = "10.1.2.0/24"  # Different CIDR for staging
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.1.0.0/24"  # Different CIDR for staging
} 