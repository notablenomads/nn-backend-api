terraform {
  cloud {
    organization = "notablenomads"

    workspaces {
      name = "nn-backend-api-shared"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Route53 zone for platform subdomain
resource "aws_route53_zone" "platform" {
  name = "platform.notablenomads.com"

  tags = {
    Environment = "shared"
    ManagedBy   = "Terraform"
    Service     = "dns"
  }
}

# Output the zone ID for other workspaces to use
output "platform_zone_id" {
  value = aws_route53_zone.platform.zone_id
} 