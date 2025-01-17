output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "alb_dns_name" {
  description = "The DNS name of the ALB"
  value       = module.api.alb_dns_name
}

output "cloudwatch_log_group" {
  description = "The CloudWatch log group name"
  value       = module.api.cloudwatch_log_group
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = module.api.ecs_cluster_name
} 