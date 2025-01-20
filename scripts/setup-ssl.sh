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

# Copy nginx configuration
echo -e "${GREEN}[INFO] Setting up initial nginx configuration...${NC}"
scp nginx.conf "$SERVER_USER@$SERVER_IP:/root/nginx.conf"

# Setup SSL certificates
ssh "$SERVER_USER@$SERVER_IP" << EOF
cd /root

# Create required directories
mkdir -p /root/certbot/conf
mkdir -p /root/certbot/www

# Stop any running containers
docker-compose down

# Start nginx for domain verification
docker-compose up -d nginx

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

docker-compose run --rm certbot certonly \
    \$staging_arg \
    \$renewal_arg \
    --non-interactive \
    --webroot \
    --webroot-path /var/www/certbot \
    --email contact@notablenomads.com \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Verify certificate files exist
if [ ! -f "/root/certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${RED}[ERROR] SSL certificate files not found${NC}"
    exit 1
fi

# Set up auto-renewal
(crontab -l 2>/dev/null || true; echo "0 12 * * * /usr/bin/docker-compose -f /root/docker-compose.yml run --rm certbot renew --quiet && /usr/bin/docker-compose -f /root/docker-compose.yml exec nginx nginx -s reload") | crontab -

# Restart nginx to use new certificates
docker-compose restart nginx

echo -e "${GREEN}[INFO] SSL certificate setup completed!${NC}"
EOF 