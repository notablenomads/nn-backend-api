###################################
# Load Balancer Outputs
###################################

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.api.alb_dns_name
}

output "cloudwatch_log_group" {
  description = "Name of the CloudWatch log group"
  value       = module.api.cloudwatch_log_group
}

###################################
# Security Group Outputs
###################################

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = module.api.alb_security_group_id
}

output "backend_security_group_id" {
  description = "ID of the backend security group"
  value       = module.api.backend_security_group_id
}

###################################
# Deployment Outputs
###################################

# EC2-specific outputs (only available when using api_ec2 module)
output "asg_name" {
  description = "Name of the Auto Scaling Group (EC2 only)"
  value       = try(module.api.asg_name, null)
}

output "launch_template_id" {
  description = "ID of the Launch Template (EC2 only)"
  value       = try(module.api.launch_template_id, null)
}

output "ec2_role_name" {
  description = "Name of the EC2 IAM role (EC2 only)"
  value       = try(module.api.ec2_role_name, null)
}

# ECS-specific outputs (only available when using api module)
output "ecs_cluster_name" {
  description = "Name of the ECS cluster (ECS only)"
  value       = try(module.api.ecs_cluster_name, null)
}

output "ecs_service_name" {
  description = "Name of the ECS service (ECS only)"
  value       = try(module.api.ecs_service_name, null)
} 