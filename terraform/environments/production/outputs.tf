output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.api.alb_dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.api.ecs_cluster_name
}

output "cloudwatch_log_group" {
  description = "Name of the CloudWatch log group"
  value       = module.api.cloudwatch_log_group
} 