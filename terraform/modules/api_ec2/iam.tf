###################################
# IAM Configuration
###################################

# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${var.app_name}-${var.environment}-ec2"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-${var.environment}-ec2"
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "api"
  }
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.app_name}-${var.environment}-ec2"
  role = aws_iam_role.ec2_role.name
}

# Policy for ECR access
resource "aws_iam_role_policy" "ecr_access" {
  name = "${var.app_name}-${var.environment}-ecr-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = ["*"]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = ["arn:aws:ecr:${var.aws_region}:*:repository/${split("/", var.ecr_repository_url)[1]}"]
      }
    ]
  })
}

# Policy for SSM access
resource "aws_iam_role_policy" "ssm_access" {
  name = "${var.app_name}-${var.environment}-ssm-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:*:parameter/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel",
          "ec2messages:AcknowledgeMessage",
          "ec2messages:DeleteMessage",
          "ec2messages:FailMessage",
          "ec2messages:GetEndpoint",
          "ec2messages:GetMessages",
          "ec2messages:SendReply"
        ]
        Resource = ["*"]
      }
    ]
  })
}

# Policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${var.app_name}-${var.environment}-cloudwatch-logs"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:*:log-group:/ec2/${var.app_name}-${var.environment}-api:*",
          "arn:aws:logs:${var.aws_region}:*:log-group:/ec2/${var.app_name}-${var.environment}-api:*:*"
        ]
      }
    ]
  })
} 