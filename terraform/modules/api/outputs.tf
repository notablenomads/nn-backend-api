output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = aws_lb.api.dns_name
}

output "cloudwatch_log_group" {
  description = "The CloudWatch log group name"
  value       = aws_cloudwatch_log_group.api.name
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "The name of the ECS service"
  value       = aws_ecs_service.api.name
} 