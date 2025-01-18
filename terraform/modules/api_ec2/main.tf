###################################
# Base Infrastructure
###################################

module "base" {
  source = "../api_base"

  app_name           = var.app_name
  environment        = var.environment
  vpc_id             = var.vpc_id
  public_subnet_ids  = var.public_subnet_ids
  container_port     = var.container_port
  target_type        = "instance"
  log_retention_days = var.log_retention_days
  log_group_prefix   = "ec2"
  domain_name        = var.domain_name
  zone_id            = var.zone_id
}

###################################
# SSM Parameters
###################################

# Create SSM parameters for environment variables
resource "aws_ssm_parameter" "environment_variables" {
  for_each = { for env in var.environment_variables : env.name => env.value }

  name  = "${var.ssm_prefix}/${each.key}"
  type  = "String"
  value = each.value

  tags = {
    Name        = "${var.app_name}-${var.environment}"
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "api"
  }
}

###################################
# EC2 Launch Template
###################################

resource "aws_launch_template" "api" {
  name_prefix   = "${var.app_name}-${var.environment}-"
  image_id      = "ami-04c372a99a14aed4e" # Amazon Linux 2023 ARM64
  instance_type = "t4g.nano"              # ARM-based instance as specified

  network_interfaces {
    associate_public_ip_address = false
    security_groups            = [module.base.backend_security_group_id]
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              
              # Enable logging
              exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
              echo "Starting user data script execution..."
              
              # Test internet connectivity
              echo "Testing internet connectivity..."
              curl -v https://amazon.com 2>&1
              
              # Install and start SSM agent
              echo "Installing SSM agent..."
              dnf install -y amazon-ssm-agent
              systemctl enable amazon-ssm-agent
              systemctl start amazon-ssm-agent
              
              # Update system
              echo "Updating system packages..."
              yum update -y
              yum install -y docker jq unzip
              
              # Start and enable Docker
              echo "Starting Docker service..."
              systemctl start docker
              systemctl enable docker
              
              # Install AWS CLI
              echo "Installing AWS CLI..."
              curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
              unzip awscliv2.zip
              ./aws/install
              
              # Test AWS connectivity
              echo "Testing AWS connectivity..."
              aws sts get-caller-identity
              
              # Login to ECR
              echo "Logging into ECR..."
              aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${split("/", var.ecr_repository_url)[0]}
              
              # Create environment file directory
              mkdir -p /etc/api
              
              # Get environment variables from SSM Parameter Store
              echo "Fetching environment variables..."
              aws ssm get-parameters-by-path \
                --path "${var.ssm_prefix}" \
                --recursive \
                --with-decryption \
                --region ${var.aws_region} \
                --query 'Parameters[*].{Name: Name, Value: Value}' \
                --output json > /etc/api/env.json

              echo "Raw SSM parameters (excluding sensitive values):"
              cat /etc/api/env.json | jq 'map(.Value |= if contains("KEY") or contains("SECRET") then "[REDACTED]" else . end)'
              
              # Combine environment variables into a single env file
              echo "Processing environment variables..."
              jq -r '.[] | select(.Name != null and .Value != null) | . as $param | 
                ($param.Name | split("/") | last) + "=" + $param.Value' /etc/api/env.json > /etc/api/container.env
              
              # Debug: Print environment variables structure
              echo "Environment file structure:"
              cat /etc/api/container.env | while read line; do
                key=$(echo $line | cut -d= -f1)
                if [[ $key != *"KEY"* && $key != *"SECRET"* ]]; then
                  echo "$key is set"
                fi
              done
              
              # Verify ***REMOVED*** specifically
              echo "Checking ***REMOVED*** in SSM response:"
              cat /etc/api/env.json | jq '.[] | select(.Name | endswith("***REMOVED***")) | .Name'
              
              # Verify ***REMOVED*** in environment file
              echo "Checking ***REMOVED*** in environment file:"
              if grep -q "***REMOVED***" /etc/api/container.env; then
                echo "***REMOVED*** is present in environment file"
              else
                echo "ERROR: ***REMOVED*** is missing from environment file"
                echo "Available environment variables (excluding secrets):"
                cat /etc/api/container.env | grep -v "KEY\|SECRET"
              fi
              
              # Start the container with proper logging
              echo "Starting the API container..."
              docker run -d \
                --name api \
                --restart always \
                -p ${var.container_port}:${var.container_port} \
                --env-file /etc/api/container.env \
                --log-driver=awslogs \
                --log-opt awslogs-group=/ec2/platform-staging-api \
                --log-opt awslogs-region=${var.aws_region} \
                --log-opt awslogs-create-group=true \
                ${var.ecr_repository_url}:latest
              
              echo "User data script completed."
              EOF
  )

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.app_name}-${var.environment}"
      Environment = var.environment
      ManagedBy   = "terraform"
      Service     = "api"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

###################################
# Auto Scaling Group
###################################

resource "aws_autoscaling_group" "api" {
  name                = "${var.app_name}-${var.environment}-asg"
  desired_capacity    = var.desired_count
  max_size           = var.desired_count + 1
  min_size           = var.desired_count
  target_group_arns  = [module.base.target_group_arn]
  vpc_zone_identifier = var.private_subnet_ids

  launch_template {
    id      = aws_launch_template.api.id
    version = "$Latest"
  }

  health_check_type         = "ELB"
  health_check_grace_period = 300

  tag {
    key                 = "Name"
    value              = "${var.app_name}-${var.environment}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value              = var.environment
    propagate_at_launch = true
  }
} 