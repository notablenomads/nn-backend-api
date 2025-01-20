#!/bin/bash

set -e

# Configuration
DOMAIN="api.notablenomads.com"
EMAIL="admin@notablenomads.com"

# Check if server IP is provided
if [ -z "$1" ]; then
    echo "Error: Server IP address is required"
    echo "Usage: $0 <server-ip> [--production]"
    exit 1
fi

SERVER_IP="$1"
SERVER_USER="root"
USE_STAGING=true

# Check for production flag
if [ "$2" = "--production" ]; then
    USE_STAGING=false
fi

# Check if ssh command is available
if ! command -v ssh &> /dev/null; then
    echo "Error: ssh command not found. Please install OpenSSH."
    exit 1
fi

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up SSL for ${DOMAIN}...${NC}"

# Create directories on server
echo -e "\n${YELLOW}Creating directories...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << EOF
    mkdir -p /root/certbot/conf
    mkdir -p /root/certbot/www
    chmod -R 755 /root/certbot/www
EOF

# Run certbot
echo -e "\n${YELLOW}Running certbot...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << EOF
    cd /root

    # Stop any running containers
    docker compose down

    # Clean up any existing challenges
    rm -rf /root/certbot/www/.well-known/acme-challenge/*

    # Start Nginx for domain verification
    docker compose up -d nginx

    # Wait for Nginx to start
    echo "Waiting for Nginx to start..."
    sleep 10

    # Run certbot
    if [ "${USE_STAGING}" = true ]; then
        echo "Using staging environment for SSL certificates"
        docker compose run --rm certbot certonly \
            --webroot \
            --webroot-path /var/www/certbot \
            --staging \
            -d ${DOMAIN} \
            --email ${EMAIL} \
            --agree-tos \
            --no-eff-email \
            --force-renewal
    else
        echo "Using production environment for SSL certificates"
        docker compose run --rm certbot certonly \
            --webroot \
            --webroot-path /var/www/certbot \
            -d ${DOMAIN} \
            --email ${EMAIL} \
            --agree-tos \
            --no-eff-email \
            --force-renewal
    fi

    # Restart containers to use new certificates
    docker compose down
    docker compose up -d

    # Verify certificates
    if [ -f "/root/certbot/conf/live/${DOMAIN}/fullchain.pem" ]; then
        echo -e "${GREEN}SSL certificates generated successfully!${NC}"
    else
        echo -e "${RED}Failed to generate SSL certificates${NC}"
        docker compose logs
        exit 1
    fi

    # Set up auto-renewal
    (crontab -l ; echo "0 0 * * * docker compose -f /root/docker-compose.yml run --rm certbot renew --quiet") | crontab -
EOF

echo -e "${GREEN}SSL setup completed! Certificates will auto-renew daily.${NC}"
if [ "${USE_STAGING}" = true ]; then
    echo -e "${YELLOW}Note: These are staging certificates. Run with --production for valid certificates.${NC}"
fi