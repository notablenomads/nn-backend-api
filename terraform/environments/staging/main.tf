terraform {
  cloud {
    organization = "notablenomads"

    workspaces {
      name = "nn-backend-api-staging"
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

module "vpc" {
  source = "../../modules/vpc"

  app_name    = var.app_name
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
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

# Create SSM parameters for environment variables (non-sensitive)
resource "aws_ssm_parameter" "env_variables" {
  for_each = {
    NODE_ENV             = "staging"
    APP_NAME            = "Notable Nomads Backend API"
    PORT                = "3000"
    HOST                = "0.0.0.0"
    API_PREFIX          = "v1"
    CORS_ENABLED_DOMAINS = "*.notablenomads.com,notablenomads.com"
    CORS_RESTRICT       = "false"
    LOG_LEVEL           = "debug"
    EMAIL_FROM_ADDRESS  = "no-reply@mail.notablenomads.com"
    EMAIL_TO_ADDRESS    = "contact@notablenomads.com"
    ***REMOVED***          = var.aws_region
  }

  name      = "/platform/staging/${each.key}"
  type      = "String"
  value     = each.value
  tags = {
    Environment = var.environment
    Type        = "Environment Variable"
    ManagedBy   = "Terraform"
    Service     = "api"
    UpdatedAt   = timestamp()
  }
}

# Note: Secrets are managed manually in SSM Parameter Store:
# - /platform/staging/***REMOVED***
# - /platform/staging/***REMOVED***
# - /platform/staging/***REMOVED***

# You can choose either EC2 or ECS deployment by commenting/uncommenting the appropriate module
module "api" {
  source = "../../modules/api_ec2"

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
  ssm_prefix         = "/platform/staging"
  domain_name        = var.domain_name
  zone_id            = data.terraform_remote_state.shared.outputs.platform_zone_id
  instance_type      = "t4g.nano"
  
  environment_variables = []
  secrets = []
}