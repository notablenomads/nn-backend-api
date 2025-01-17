###################################
# IAM Roles and Policies
###################################

# ECS Task Execution Role - Used by ECS to pull images and write logs
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.app_name}-${var.environment}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-${var.environment}-ecs-execution"
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "api"
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow reading SSM parameters for secrets
resource "aws_iam_role_policy" "ecs_execution_role_ssm" {
  name = "${var.app_name}-${var.environment}-ssm-access"
  role = aws_iam_role.ecs_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = [
          "arn:aws:ssm:${var.aws_region}:*:parameter${var.ssm_prefix}/*"
        ]
      }
    ]
  })
}

# ECS Task Role - Used by the application itself
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.app_name}-${var.environment}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-${var.environment}-ecs-task"
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "api"
  }
}

# Get current AWS account ID
data "aws_caller_identity" "current" {} 