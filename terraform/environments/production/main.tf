terraform {
  backend "s3" {
    bucket         = "nn-terraform-state-eu"
    key            = "production/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "nn-terraform-locks"
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

module "vpc" {
  source = "../../modules/vpc"

  app_name    = var.app_name
  environment = var.environment
}

module "api" {
  source = "../../modules/api"

  app_name            = var.app_name
  environment         = var.environment
  aws_region          = var.aws_region
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  private_subnet_ids  = module.vpc.private_subnet_ids
  ecr_repository_url  = var.ecr_repository_url
  container_port      = 3000
  task_cpu           = 256            # Reduced CPU but still sufficient
  task_memory        = 512            # Reduced memory but still sufficient
  log_retention_days = 3              # Reduced from 7 to 3 days
  desired_count      = 1              # Single task with Fargate Spot
  ssm_prefix         = "/platform/production"
  domain_name        = var.domain_name
  zone_id            = var.zone_id
  environment_variables = [
    {
      name  = "NODE_ENV"
      value = "production"
    },
    {
      name  = "APP_NAME"
      value = "Notable Nomads Backend API"
    },
    {
      name  = "PORT"
      value = "3000"
    },
    {
      name  = "HOST"
      value = "0.0.0.0"
    },
    {
      name  = "API_PREFIX"
      value = "v1"
    },
    {
      name  = "CORS_ENABLED_DOMAINS"
      value = "*.notablenomads.com,notablenomads.com,*.platform.notablenomads.com,platform.notablenomads.com"
    },
    {
      name  = "CORS_RESTRICT"
      value = "true"
    },
    {
      name  = "LOG_LEVEL"
      value = "warn"
    }
  ]
  secrets = [
    {
      name      = "***REMOVED***"
      valueFrom = "/platform/production/aws/access_key_id"
    },
    {
      name      = "***REMOVED***"
      valueFrom = "/platform/production/aws/secret_access_key"
    },
    {
      name      = "***REMOVED***"
      valueFrom = "/platform/production/aws/region"
    },
    {
      name      = "***REMOVED***"
      valueFrom = "/platform/production/gemini/api_key"
    }
  ]
}

# Add NS record for platform subdomain in parent domain
resource "aws_route53_record" "platform_ns" {
  zone_id = "Z09251511N0OESPVIRFES"  # Parent domain zone ID (notablenomads.com)
  name    = "platform.notablenomads.com"
  type    = "NS"
  ttl     = "60"  # Reduced from 300 to 60 seconds for faster propagation

  records = [
    "ns-329.awsdns-41.com",
    "ns-1719.awsdns-22.co.uk",
    "ns-588.awsdns-09.net",
    "ns-1357.awsdns-41.org"
  ]
} 