#!/bin/bash

set -e

# Check if server IP is provided
if [ -z "$1" ]; then
    echo "Error: Server IP is required"
    echo "Usage: $0 <server-ip> [--production] [--force-renewal]"
    exit 1
fi

# Configuration
SERVER_IP="$1"
SERVER_USER="root"
DOMAIN="api.notablenomads.com"
USE_STAGING="true"  # Default to staging for testing
FORCE_RENEWAL="false"

# Parse additional arguments
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --production)
            USE_STAGING="false"
            shift
            ;;
        --force-renewal)
            FORCE_RENEWAL="true"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}[INFO] Setting up SSL certificates...${NC}"
echo -e "${GREEN}[INFO] Using staging: $USE_STAGING${NC}"
echo -e "${GREEN}[INFO] Force renewal: $FORCE_RENEWAL${NC}"

# Verify DNS configuration
echo -e "\n${GREEN}[INFO] Verifying DNS configuration...${NC}"
CURRENT_IP=$(dig +short $DOMAIN)
if [ -z "$CURRENT_IP" ]; then
    echo -e "${RED}[ERROR] DNS record not found for $DOMAIN${NC}"
    echo "Please configure your DNS to point $DOMAIN to $SERVER_IP"
    exit 1
elif [ "$CURRENT_IP" != "$SERVER_IP" ]; then
    echo -e "${RED}[WARNING] DNS record points to $CURRENT_IP instead of $SERVER_IP${NC}"
    echo "Please update your DNS settings or wait for propagation"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Copy nginx configuration
echo -e "\n${GREEN}[INFO] Setting up initial nginx configuration...${NC}"
scp nginx.conf "$SERVER_USER@$SERVER_IP:/root/nginx.conf"

# Setup SSL certificates
ssh "$SERVER_USER@$SERVER_IP" << EOF
cd /root

# Clean up any existing certbot/nginx state
echo "Cleaning up existing state..."
docker-compose down
rm -rf /root/certbot/www/.well-known/acme-challenge/*

# Create required directories with proper permissions
echo "Creating directories..."
mkdir -p /root/certbot/conf
mkdir -p /root/certbot/www/.well-known/acme-challenge
chmod -R 755 /root/certbot/www

# Start nginx for domain verification
echo "Starting nginx..."
docker-compose up -d nginx

# Wait for nginx to start and stabilize
echo "Waiting for nginx to stabilize..."
sleep 10

# Test nginx configuration
echo "Testing nginx configuration..."
if ! docker-compose exec nginx nginx -t; then
    echo "Nginx configuration test failed"
    docker-compose logs nginx
    exit 1
fi

# Test ACME challenge directory
echo "Testing ACME challenge path..."
if ! curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/.well-known/acme-challenge/test | grep -q "404"; then
    echo "ACME challenge path test failed"
    docker-compose logs nginx
    exit 1
fi

# Get SSL certificate
if [ "$USE_STAGING" = "true" ]; then
    staging_arg="--staging"
else
    staging_arg=""
fi

if [ "$FORCE_RENEWAL" = "true" ]; then
    renewal_arg="--force-renewal"
else
    renewal_arg=""
fi

echo "Requesting certificate..."
docker-compose run --rm certbot certonly \
    \$staging_arg \
    \$renewal_arg \
    --non-interactive \
    --webroot \
    --webroot-path /var/www/certbot \
    --email admin@notablenomads.com \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Verify certificate files exist
if [ ! -f "/root/certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${RED}[ERROR] SSL certificate files not found${NC}"
    echo "Nginx logs:"
    docker-compose logs nginx
    echo "Certbot logs:"
    docker-compose logs certbot
    exit 1
fi

# Set up auto-renewal
echo "Setting up auto-renewal..."
(crontab -l 2>/dev/null || true; echo "0 12 * * * /usr/bin/docker-compose -f /root/docker-compose.yml run --rm certbot renew --quiet && /usr/bin/docker-compose -f /root/docker-compose.yml exec nginx nginx -s reload") | crontab -

# Restart nginx to use new certificates
echo "Restarting nginx..."
docker-compose restart nginx

echo -e "${GREEN}[INFO] SSL certificate setup completed!${NC}"
EOF 