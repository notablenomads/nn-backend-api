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
# Launch Template
###################################

resource "aws_launch_template" "api" {
  name_prefix   = "${var.app_name}-${var.environment}-"
  image_id      = var.ami_id # Amazon Linux 2023 ARM64
  instance_type = var.instance_type

  network_interfaces {
    associate_public_ip_address = false
    security_groups            = [module.base.backend_security_group_id]
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

    # Install and start SSM agent
    dnf install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent

    # Install required packages
    dnf install -y docker jq unzip

    # Start Docker
    systemctl start docker
    systemctl enable docker

    # Install AWS CLI
    curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install

    # Login to ECR
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${var.ecr_repository_url}

    # Create environment file directory
    mkdir -p /etc/api

    # Get environment variables from SSM
    aws ssm get-parameters-by-path \
      --path "${var.ssm_prefix}" \
      --recursive \
      --with-decryption \
      --region ${var.aws_region} \
      --query 'Parameters[*].{Name: Name, Value: Value}' \
      --output json > /etc/api/env.json

    # Process environment variables
    jq -r '.[] | select(.Name != null and .Value != null) | . as $param | 
      ($param.Name | split("/") | last) + "=" + $param.Value' /etc/api/env.json > /etc/api/container.env

    # Start the container
    docker run -d \
      --name api \
      --restart always \
      -p ${var.container_port}:${var.container_port} \
      --env-file /etc/api/container.env \
      --log-driver=awslogs \
      --log-opt awslogs-group=${module.base.cloudwatch_log_group} \
      --log-opt awslogs-region=${var.aws_region} \
      --log-opt awslogs-create-group=true \
      ${var.ecr_repository_url}:latest
  EOF
  )

  monitoring {
    enabled = false # Disable detailed monitoring to reduce costs
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
  max_size           = var.desired_count
  min_size           = var.desired_count
  target_group_arns  = [module.base.target_group_arn]
  vpc_zone_identifier = var.private_subnet_ids
  health_check_grace_period = 180 # Reduced from 300 to save costs during scaling

  launch_template {
    id      = aws_launch_template.api.id
    version = "$Latest"
  }

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