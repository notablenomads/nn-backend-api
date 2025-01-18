terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "nn-terraform-state-eu"
    key            = "shared/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "nn-terraform-locks"
  }
}

provider "aws" {
  region = "eu-central-1"
}

module "dns" {
  source = "../../modules/dns"
}

# Create NS record in parent domain for delegation
resource "aws_route53_record" "platform_ns" {
  allow_overwrite = true  # Allow overwriting existing record
  zone_id = "Z09251511N0OESPVIRFES"  # notablenomads.com zone ID
  name    = "platform.notablenomads.com"
  type    = "NS"
  ttl     = "60"

  records = module.dns.platform_name_servers
}

# Output the zone ID and nameservers
output "platform_zone_id" {
  description = "The Route53 zone ID for platform.notablenomads.com"
  value       = module.dns.platform_zone_id
}

output "platform_name_servers" {
  description = "The name servers for platform.notablenomads.com"
  value       = module.dns.platform_name_servers
} 