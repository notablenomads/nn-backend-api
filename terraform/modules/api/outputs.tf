###################################
# Load Balancer Outputs
###################################

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.api.dns_name
}

output "cloudwatch_log_group" {
  description = "Name of the CloudWatch log group for API logs"
  value       = aws_cloudwatch_log_group.api.name
}

###################################
# ECS Outputs
###################################

output "ecs_cluster_name" {
  description = "Name of the ECS cluster running the API"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service running the API tasks"
  value       = aws_ecs_service.api.name
} 