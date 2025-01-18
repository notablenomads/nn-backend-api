###################################
# Core Variables
###################################

variable "aws_region" {
  description = "AWS region where resources will be created"
  type        = string
}

variable "app_name" {
  description = "Name of the application"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., production, staging)"
  type        = string
}

###################################
# Network Variables
###################################

variable "vpc_id" {
  description = "ID of the VPC where resources will be created"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for EC2 instances"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB"
  type        = list(string)
}

###################################
# Container Configuration
###################################

variable "ecr_repository_url" {
  description = "URL of the ECR repository containing the API image"
  type        = string
}

variable "container_port" {
  description = "Port number the container listens on"
  type        = number
  default     = 3000
}

variable "desired_count" {
  description = "Desired number of EC2 instances to run"
  type        = number
  default     = 1
}

###################################
# Monitoring Configuration
###################################

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 1
}

###################################
# Environment and Secrets
###################################

variable "environment_variables" {
  description = "List of environment variables for the container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "secrets" {
  description = "List of secrets to inject into the container from SSM"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "ssm_prefix" {
  description = "SSM parameter prefix for secrets (e.g., /platform/production)"
  type        = string
}

###################################
# DNS Configuration
###################################

variable "domain_name" {
  description = "Domain name for the API"
  type        = string
}

variable "zone_id" {
  description = "Route53 hosted zone ID for the domain"
  type        = string
}

###################################
# Resource Tagging
###################################

variable "tags" {
  description = "Default tags to apply to all resources"
  type        = map(string)
  default = {
    ManagedBy = "terraform"
    Service   = "api"
  }
}

variable "instance_type" {
  description = "The EC2 instance type to use"
  type        = string
  default     = "t4g.nano"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-04c372a99a14aed4e"  # Amazon Linux 2023 ARM64
} 