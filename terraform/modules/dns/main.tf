terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_route53_zone" "platform" {
  name = "platform.notablenomads.com"

  tags = {
    Name        = "platform-zone"
    ManagedBy   = "terraform"
    Environment = "shared"
  }
}

# Output the zone ID for use in other modules
output "platform_zone_id" {
  description = "The Route53 zone ID for platform.notablenomads.com"
  value       = aws_route53_zone.platform.zone_id
}

# Output the name servers for the zone
output "platform_name_servers" {
  description = "The name servers for platform.notablenomads.com"
  value       = aws_route53_zone.platform.name_servers
} 