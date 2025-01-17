aws_region         = "eu-central-1"
app_name           = "platform"
environment        = "staging"
ecr_repository_url = "446362978848.dkr.ecr.eu-central-1.amazonaws.com/platform-api"

vpc_cidr           = "10.1.0.0/16"
private_subnet_cidr = "10.1.2.0/24"
public_subnet_cidr  = "10.1.0.0/24"

ssm_prefix = "/platform/staging" 