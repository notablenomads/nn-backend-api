#!/bin/bash

set -e

# Check if server IP is provided
if [ -z "$1" ]; then
    echo "Error: Server IP is required"
    echo "Usage: $0 <server-ip> [--production]"
    exit 1
fi

# Configuration
SERVER_IP="$1"
SERVER_USER="root"
DOMAIN="api.notablenomads.com"
USE_STAGING=true

# Check if --production flag is provided
if [ "$2" = "--production" ]; then
    USE_STAGING=false
fi

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}[INFO] Setting up SSL certificates...${NC}"

# Create required directories
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p /root/certbot/conf /root/certbot/www"

# Copy nginx configuration for initial certificate setup
echo -e "${GREEN}[INFO] Setting up initial nginx configuration...${NC}"
cat > nginx.conf.tmp << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.notablenomads.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
EOF

scp nginx.conf.tmp "$SERVER_USER@$SERVER_IP:/root/nginx.conf"
rm nginx.conf.tmp

# Set up SSL certificates
echo -e "${GREEN}[INFO] Setting up SSL certificates...${NC}"
ssh "$SERVER_USER@$SERVER_IP" << ENDSSH
cd /root

# Start nginx for certificate validation
docker-compose up -d nginx

# Generate certificates
STAGING_FLAG=""
if [ "${USE_STAGING}" = "true" ]; then
    STAGING_FLAG="--test-cert"
fi

docker-compose run --rm certbot certonly --webroot \
    --webroot-path /var/www/certbot \
    --email admin@notablenomads.com \
    --agree-tos --no-eff-email \
    -d ${DOMAIN} \
    \${STAGING_FLAG}

# Set up auto-renewal
(crontab -l 2>/dev/null || true; echo "0 12 * * * /usr/bin/docker-compose -f /root/docker-compose.yml run --rm certbot renew --quiet") | crontab -

echo "SSL certificates have been set up successfully!"
ENDSSH

echo -e "${GREEN}[INFO] SSL certificate setup completed!${NC}" 