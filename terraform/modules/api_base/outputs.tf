###################################
# Load Balancer Outputs
###################################

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.api.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.api.arn
}

output "target_group_arn" {
  description = "ARN of the ALB target group"
  value       = aws_lb_target_group.api.arn
}

###################################
# Security Group Outputs
###################################

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "backend_security_group_id" {
  description = "ID of the backend security group"
  value       = aws_security_group.backend.id
}

###################################
# Monitoring Outputs
###################################

output "cloudwatch_log_group" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.api.name
}

###################################
# DNS Outputs
###################################

output "domain_name" {
  description = "Domain name of the API"
  value       = aws_route53_record.api_alias.name
}

output "certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.api.arn
} 