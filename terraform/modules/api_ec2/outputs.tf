###################################
# Load Balancer Outputs
###################################

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.base.alb_dns_name
}

output "cloudwatch_log_group" {
  description = "Name of the CloudWatch log group for API logs"
  value       = module.base.cloudwatch_log_grouph
}

###################################
# EC2 Outputs
###################################

output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.api.name
}

output "launch_template_id" {
  description = "ID of the Launch Template"
  value       = aws_launch_template.api.id
}

output "launch_template_version" {
  description = "Latest version of the Launch Template"
  value       = aws_launch_template.api.latest_version
}

###################################
# Security Outputs
###################################

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = module.base.alb_security_group_id
}

output "backend_security_group_id" {
  description = "ID of the backend security group"
  value       = module.base.backend_security_group_id
}

output "ec2_role_name" {
  description = "Name of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.name
} 