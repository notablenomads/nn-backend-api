variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.1.0.0/24", "10.1.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.1.2.0/24", "10.1.3.0/24"]
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.1.0.0/16"
}

locals {
  tags = {
    Project     = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

// ... existing code ...

# VPC
resource "aws_vpc" "this" {
  count = 1

  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${var.app_name}-${var.environment}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "this" {
  count = 1

  vpc_id = aws_vpc.this[0].id

  tags = merge(local.tags, {
    Name = "${var.app_name}-${var.environment}"
  })
}

# Route Tables
resource "aws_route_table" "public" {
  count = 1

  vpc_id = aws_vpc.this[0].id

  tags = merge(local.tags, {
    Name = "${var.app_name}-${var.environment}-public"
  })
}

resource "aws_route_table" "private" {
  count = 1

  vpc_id = aws_vpc.this[0].id

  tags = merge(local.tags, {
    Name = "${var.app_name}-${var.environment}-private"
  })
}

# Routes
resource "aws_route" "public_internet_gateway" {
  count = 1

  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this[0].id
}

# NAT Gateway
resource "aws_eip" "nat" {
  count = 1
  domain = "vpc"

  tags = merge(local.tags, {
    Name = "${var.app_name}-${var.environment}-nat"
  })
}

resource "aws_nat_gateway" "this" {
  count = 1

  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.tags, {
    Name = "${var.app_name}-${var.environment}"
  })
}

resource "aws_route" "private_nat_gateway" {
  count = 1

  route_table_id         = aws_route_table.private[0].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[0].id
}

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.this[0].id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.tags, {
    Name = "${var.app_name}-${var.environment}-public-${count.index + 1}"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.this[0].id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(local.tags, {
    Name = "${var.app_name}-${var.environment}-private-${count.index + 1}"
  })
}

# Update route table associations
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[0].id
}

resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
} 