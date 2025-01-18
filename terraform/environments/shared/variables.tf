variable "parent_zone_id" {
  description = "The Route53 zone ID for the parent domain (notablenomads.com)"
  type        = string
}

variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "eu-central-1"
}

variable "***REMOVED***" {
  description = "AWS Region (prefer setting via environment variable)"
  type        = string
  default     = null
}

# Optional AWS credentials (prefer environment variables)
variable "***REMOVED***" {
  description = "AWS Access Key ID (prefer setting via environment variable)"
  type        = string
  default     = null
}

variable "***REMOVED***" {
  description = "AWS Secret Access Key (prefer setting via environment variable)"
  type        = string
  default     = null
  sensitive   = true
} 