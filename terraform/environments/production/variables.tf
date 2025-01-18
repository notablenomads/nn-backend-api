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

variable "zone_id" {
  description = "Route53 hosted zone ID for platform.notablenomads.com"
  type        = string
  default     = "Z0267257380A4T4J8XQ4U"  # platform.notablenomads.com hosted zone
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