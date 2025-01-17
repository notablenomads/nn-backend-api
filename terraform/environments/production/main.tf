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

# DNS Management
module "dns" {
  source = "../../modules/dns"

  app_name       = var.app_name
  environment    = var.environment
  parent_zone_id = "Z09251511N0OESPVIRFES"  # notablenomads.com zone ID
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
  task_cpu           = 256
  task_memory        = 512
  log_retention_days = 1
  desired_count      = 1
  ssm_prefix         = "/platform/production"
  domain_name        = "api.${module.dns.domain_name}"
  zone_id            = module.dns.zone_id
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
      name  = "CORS_RESTRICT"
      value = "false"
    },
    {
      name  = "LOG_LEVEL"
      value = "error"
    }
  ]
  secrets = [
    {
      name      = "AWS_ACCESS_KEY_ID"
      valueFrom = "/platform/production/aws/access_key_id"
    },
    {
      name      = "AWS_SECRET_ACCESS_KEY"
      valueFrom = "/platform/production/aws/secret_access_key"
    },
    {
      name      = "AWS_REGION"
      valueFrom = "/platform/production/aws/region"
    },
    {
      name      = "GEMINI_API_KEY"
      valueFrom = "/platform/production/gemini/api_key"
    }
  ]
} 