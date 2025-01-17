# Create the platform subdomain hosted zone
resource "aws_route53_zone" "platform" {
  name = "platform.notablenomads.com"

  tags = {
    Name        = "platform-subdomain"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Create NS record in parent domain for delegation
resource "aws_route53_record" "platform_ns" {
  zone_id = var.parent_zone_id  # notablenomads.com zone ID
  name    = "platform.notablenomads.com"
  type    = "NS"
  ttl     = "60"

  records = aws_route53_zone.platform.name_servers
} 