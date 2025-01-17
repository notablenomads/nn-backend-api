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
  ssm_prefix         = "/platform/staging"
  domain_name        = var.domain_name
  zone_id            = "Z02232681YNYU29ZE5JT1"
  environment_variables = [
    {
      name  = "NODE_ENV"
      value = "staging"
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
      value = "/v1"
    }
  ]
  secrets = [
    {
      name      = "***REMOVED***"
      valueFrom = "/platform/staging/aws/access_key_id"
    },
    {
      name      = "***REMOVED***"
      valueFrom = "/platform/staging/aws/secret_access_key"
    },
    {
      name      = "***REMOVED***"
      valueFrom = "/platform/staging/aws/region"
    },
    {
      name      = "***REMOVED***"
      valueFrom = "/platform/staging/gemini/api_key"
    }
  ]
} 