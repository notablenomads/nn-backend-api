###################################
# Core Variables
###################################

variable "aws_region" {
  description = "AWS region where resources will be created (e.g., eu-central-1)"
  type        = string
}

variable "app_name" {
  description = "Name of the application (e.g., platform)"
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
  description = "List of private subnet IDs for ECS tasks"
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

variable "task_cpu" {
  description = "CPU units for the ECS task (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Memory (in MiB) for the ECS task"
  type        = number
  default     = 512
}

variable "container_port" {
  description = "Port number the container listens on"
  type        = number
  default     = 3000
}

variable "desired_count" {
  description = "Desired number of ECS tasks to run"
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
  type        = list(map(string))
  default     = []
}

variable "secrets" {
  description = "List of secrets to inject into the container from SSM"
  type        = list(map(string))
  default     = []
}

variable "ssm_prefix" {
  description = "SSM parameter prefix for secrets (e.g., /platform/production)"
  type        = string
}

###################################
# DNS Configuration
###################################

variable "domain_name" {
  description = "Domain name for the API (e.g., api.platform.notablenomads.com)"
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