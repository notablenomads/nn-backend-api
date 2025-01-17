aws_region         = "eu-central-1"
app_name           = "platform"
environment        = "production"
ecr_repository_url = "your-account-id.dkr.ecr.eu-central-1.amazonaws.com/platform-api"

vpc_cidr           = "10.0.0.0/16"
private_subnet_cidr = "10.0.2.0/24"
public_subnet_cidr  = "10.0.0.0/24"

ssm_parameter_prefix = "/copilot/platform/production/secrets" 