terraform {
  cloud {
    organization = "notablenomads"

    workspaces {
      name = "nn-backend-api-production"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Set minimum Terraform version
  required_version = ">= 1.0.0"
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "terraform"
      Project     = var.app_name
    }
  }
}

# Get the zone ID from the shared state
data "terraform_remote_state" "shared" {
  backend = "remote"
  
  config = {
    organization = "notablenomads"
    workspaces = {
      name = "nn-backend-api-shared"
    }
  }
}

module "vpc" {
  source = "../../modules/vpc"

  app_name    = var.app_name
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

# Create SSM parameters for environment variables (non-sensitive)
resource "aws_ssm_parameter" "env_variables" {
  for_each = {
    NODE_ENV             = var.environment
    APP_NAME            = "Notable Nomads Backend API"
    PORT                = tostring(var.container_port)
    HOST                = "0.0.0.0"
    API_PREFIX          = "v1"
    CORS_ENABLED_DOMAINS = var.cors_enabled_domains
    CORS_RESTRICT       = "false"
    LOG_LEVEL           = var.log_level
    EMAIL_FROM_ADDRESS  = "no-reply@mail.notablenomads.com"
    EMAIL_TO_ADDRESS    = "contact@notablenomads.com"
    AWS_REGION          = var.aws_region
  }

  name      = "${var.ssm_prefix}/${each.key}"
  type      = "String"
  value     = each.value
  tier      = "Standard"

  tags = {
    Type        = "Environment Variable"
    UpdatedAt   = timestamp()
  }

  lifecycle {
    ignore_changes = [
      tags["UpdatedAt"]
    ]
  }
}

module "api" {
  source = "../../modules/api_ec2"

  app_name            = var.app_name
  environment         = var.environment
  aws_region          = var.aws_region
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  private_subnet_ids  = module.vpc.private_subnet_ids
  ecr_repository_url  = var.ecr_repository_url
  container_port      = var.container_port
  desired_count       = 1
  log_retention_days  = 1
  ssm_prefix         = var.ssm_prefix
  domain_name        = var.domain_name
  zone_id            = data.terraform_remote_state.shared.outputs.platform_zone_id
  instance_type      = var.instance_type
  
  environment_variables = []
  secrets = []
}

# Outputs for reference
output "api_endpoint" {
  description = "The API endpoint URL"
  value       = "https://${var.domain_name}"
}

output "load_balancer_dns" {
  description = "The DNS name of the load balancer"
  value       = module.api.load_balancer_dns
} 