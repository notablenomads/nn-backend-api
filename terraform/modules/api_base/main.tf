###################################
# Load Balancer Resources
###################################

resource "aws_lb" "api" {
  name               = "${var.app_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = var.public_subnet_ids

  enable_deletion_protection = false
  idle_timeout             = 30

  tags = {
    Name        = "${var.app_name}-${var.environment}-alb"
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "api"
  }
}

resource "aws_lb_target_group" "api" {
  name        = "${var.app_name}-${var.environment}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = var.target_type # "ip" for ECS, "instance" for EC2

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 300
    matcher            = "200"
    path               = "/v1/health"
    port               = "traffic-port"
    protocol           = "HTTP"
    timeout            = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30
}

###################################
# HTTPS/TLS Configuration
###################################

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_acm_certificate" "api" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Name        = "${var.app_name}-${var.environment}-cert"
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "api"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Output validation options for debugging
output "acm_validation_options" {
  value = aws_acm_certificate.api.domain_validation_options
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.api.domain_validation_options : dvo.domain_name => {
      name    = dvo.resource_record_name
      record  = dvo.resource_record_value
      type    = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.zone_id
}

# Output created DNS records for debugging
output "validation_dns_records" {
  value = {
    for k, v in aws_route53_record.cert_validation : k => {
      name    = v.name
      records = v.records
      type    = v.type
    }
  }
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn = aws_acm_certificate.api.arn
  
  validation_record_fqdns = [
    for record in aws_route53_record.cert_validation : record.fqdn
  ]

  timeouts {
    create = "45m"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.api.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate.api.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  depends_on = [aws_acm_certificate_validation.api]
}

###################################
# DNS Configuration
###################################

resource "aws_route53_record" "api_alias" {
  zone_id = var.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.api.dns_name
    zone_id                = aws_lb.api.zone_id
    evaluate_target_health = true
  }
}

###################################
# CloudWatch Logs
###################################

resource "aws_cloudwatch_log_group" "api" {
  name              = "/${var.log_group_prefix}/${var.app_name}-${var.environment}-api"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.app_name}-${var.environment}-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
    Service     = "api"
  }
} 