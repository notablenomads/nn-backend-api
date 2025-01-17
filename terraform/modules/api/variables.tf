variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "ecr_repository_url" {
  description = "ECR repository URL for the API container image"
  type        = string
}

variable "task_cpu" {
  description = "CPU units for the task (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Memory for the task in MiB"
  type        = number
  default     = 512
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 1
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 3
}

variable "environment_variables" {
  description = "Environment variables for the container"
  type        = list(map(string))
  default     = []
}

variable "secrets" {
  description = "Secrets for the container"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "ssm_prefix" {
  description = "SSM parameter prefix for secrets"
  type        = string
} 