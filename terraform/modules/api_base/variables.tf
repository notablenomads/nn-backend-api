###################################
# Core Variables
###################################

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

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB"
  type        = list(string)
}

###################################
# Container Configuration
###################################

variable "container_port" {
  description = "Port number the container listens on"
  type        = number
  default     = 3000
}

variable "target_type" {
  description = "Type of target for ALB target group (ip for ECS, instance for EC2)"
  type        = string
  validation {
    condition     = contains(["ip", "instance"], var.target_type)
    error_message = "Target type must be either 'ip' or 'instance'"
  }
}

###################################
# Monitoring Configuration
###################################

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 1
}

variable "log_group_prefix" {
  description = "Prefix for CloudWatch log group (e.g., ecs or ec2)"
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