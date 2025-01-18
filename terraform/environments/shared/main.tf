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

# Create NS record in parent domain for delegation
resource "aws_route53_record" "platform_ns" {
  zone_id = var.parent_zone_id  # notablenomads.com zone ID
  name    = "platform.notablenomads.com"
  type    = "NS"
  ttl     = "30"  # Lower TTL for faster propagation

  records = aws_route53_zone.platform.name_servers
}

# Output the zone ID and nameservers
output "platform_zone_id" {
  description = "The Route53 zone ID for platform.notablenomads.com"
  value       = aws_route53_zone.platform.zone_id
}

output "platform_nameservers" {
  description = "Nameservers for platform.notablenomads.com"
  value       = aws_route53_zone.platform.name_servers
} 