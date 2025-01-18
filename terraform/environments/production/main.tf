terraform {
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
}

# Create SSM parameters for environment variables (non-sensitive)
resource "aws_ssm_parameter" "env_variables" {
  for_each = {
    NODE_ENV             = "production"
    APP_NAME            = "Notable Nomads Backend API"
    PORT                = "3000"
    HOST                = "0.0.0.0"
    API_PREFIX          = "v1"
    CORS_ENABLED_DOMAINS = "*.notablenomads.com,notablenomads.com"
    CORS_RESTRICT       = "false"
    LOG_LEVEL           = "error"
    EMAIL_FROM_ADDRESS  = "no-reply@mail.notablenomads.com"
    EMAIL_TO_ADDRESS    = "contact@notablenomads.com"
    ***REMOVED***          = var.aws_region
  }

  name      = "/platform/production/${each.key}"
  type      = "String"
  value     = each.value
  overwrite = true
  tags = {
    Environment = var.environment
    Type        = "Environment Variable"
    ManagedBy   = "Terraform"
    Service     = "api"
    UpdatedAt   = timestamp()
  }
}

# Note: Secrets are managed manually in SSM Parameter Store:
# - /platform/production/***REMOVED***
# - /platform/production/***REMOVED***
# - /platform/production/***REMOVED***

module "api" {
  source = "../../modules/api_ec2"  # For EC2 deployment

  app_name            = var.app_name
  environment         = var.environment
  aws_region          = var.aws_region
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  private_subnet_ids  = module.vpc.private_subnet_ids
  ecr_repository_url  = var.ecr_repository_url
  container_port      = 3000
  desired_count       = 1
  log_retention_days  = 1
  ssm_prefix         = "/platform/production"
  domain_name        = "api.platform.notablenomads.com"
  zone_id            = data.terraform_remote_state.shared.outputs.platform_zone_id
  
  # We don't need to specify environment_variables and secrets here anymore
  # as they are managed by SSM parameters above
  environment_variables = []
  secrets = []
} 