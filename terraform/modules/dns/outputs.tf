output "zone_id" {
  description = "The ID of the platform subdomain hosted zone"
  value       = aws_route53_zone.platform.zone_id
}

output "domain_name" {
  description = "The name of the platform subdomain"
  value       = trimsuffix(aws_route53_zone.platform.name, ".")
} 