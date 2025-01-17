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
  description = "ECR repository URL"
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

variable "domain_name" {
  description = "Domain name for the API"
  type        = string
  default     = "api.staging.platform.notablenomads.com"
}

variable "zone_id" {
  description = "Route53 hosted zone ID for notablenomads.com"
  type        = string
  # You'll need to get this from your AWS Console or using AWS CLI:
  # aws route53 list-hosted-zones | grep notablenomads.com -B1
} 