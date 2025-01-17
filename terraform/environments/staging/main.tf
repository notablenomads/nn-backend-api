terraform {
  backend "s3" {
    bucket         = "nn-terraform-state-eu"
    key            = "staging/terraform.tfstate"
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
  task_cpu           = 256
  task_memory        = 512
  log_retention_days = 1
  desired_count      = 1
  ssm_prefix         = "/platform/staging"
  domain_name        = var.domain_name
  zone_id            = "Z02232681YNYU29ZE5JT1"
  environment_variables = [
    {
      name  = "NODE_ENV"
      value = "staging"
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
      value = "*.notablenomads.com,notablenomads.com"
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
      valueFrom = "/platform/staging/aws/access_key_id"
    },
    {
      name      = "AWS_SECRET_ACCESS_KEY"
      valueFrom = "/platform/staging/aws/secret_access_key"
    },
    {
      name      = "AWS_REGION"
      valueFrom = "/platform/staging/aws/region"
    },
    {
      name      = "GEMINI_API_KEY"
      valueFrom = "/platform/staging/gemini/api_key"
    }
  ]
} 