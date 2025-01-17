terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.2.0"

  backend "s3" {
    bucket         = "nn-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "nn-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "${var.app_name}-${var.environment}"
  cidr = var.vpc_cidr

  azs             = ["${var.aws_region}a"]
  private_subnets = [var.private_subnet_cidr]
  public_subnets  = [var.public_subnet_cidr]

  enable_nat_gateway = true
  single_nat_gateway = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Environment = var.environment
    Project     = var.app_name
  }
}

# API Service
module "api" {
  source = "../../modules/api"

  aws_region         = var.aws_region
  app_name           = var.app_name
  environment        = var.environment
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnets
  public_subnet_ids  = module.vpc.public_subnets
  ecr_repository_url = var.ecr_repository_url

  # Task configuration
  task_cpu    = 256
  task_memory = 512
  desired_count = 1

  # Log configuration
  log_retention_days = 3

  secrets = [
    {
      name      = "AWS_REGION"
      valueFrom = "${var.ssm_parameter_prefix}/AWS_REGION"
    },
    {
      name      = "AWS_ACCESS_KEY_ID"
      valueFrom = "${var.ssm_parameter_prefix}/AWS_ACCESS_KEY_ID"
    },
    {
      name      = "AWS_SECRET_ACCESS_KEY"
      valueFrom = "${var.ssm_parameter_prefix}/AWS_SECRET_ACCESS_KEY"
    },
    {
      name      = "GEMINI_API_KEY"
      valueFrom = "${var.ssm_parameter_prefix}/GEMINI_API_KEY"
    }
  ]
} 