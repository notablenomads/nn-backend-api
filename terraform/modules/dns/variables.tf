variable "environment" {
  description = "Environment name"
  type        = string
}

variable "parent_zone_id" {
  description = "Route53 hosted zone ID for parent domain (notablenomads.com)"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
} 