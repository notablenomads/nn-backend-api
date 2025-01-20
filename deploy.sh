#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP=""
SERVER_USER="root"
APP_NAME="nn-backend-api"
DOMAIN="api.notablenomads.com"
DOCKER_HUB_USERNAME="mrdevx"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
log_info() {
    echo -e "\033[0;34m[INFO] $1\033[0m"
}

log_warn() {
    echo -e "\033[0;33m[WARN] $1\033[0m"
}

log_error() {
    echo -e "\033[0;31m[ERROR] $1\033[0m"
    exit 1
}

# Check if required commands exist
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Required command '$1' is not installed."
        exit 1
    fi
}

# Check if SSH connection can be established
check_ssh_connection() {
    if ! ssh -o ConnectTimeout=10 "$1" "echo 'SSH connection successful'" &> /dev/null; then
        log_error "Could not establish SSH connection to $1"
        exit 1
    fi
}

# Validate input parameters
if [ -z "$1" ]; then
    log_error "Server IP address is required."
    echo "Usage: $0 <server-ip> [--production]"
    exit 1
fi

SERVER_IP="$1"
USE_STAGING=true

# Check if --production flag is provided
if [ "$2" = "--production" ]; then
    USE_STAGING=false
    log_info "Using production environment for SSL certificates"
else
    log_info "Using staging environment for SSL certificates"
fi

# Check required commands
check_command "docker"
check_command "ssh"
check_command "scp"

# Check SSH connection
check_ssh_connection "$SERVER_USER@$SERVER_IP"

# Build and push Docker image
log_info "Building Docker image..."
docker build -t mrdevx/nn-backend-api:latest .
docker push mrdevx/nn-backend-api:latest

# Set up server configuration
log_info "Setting up server configuration..."
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p /root/certbot/conf /root/certbot/www"

# Check if SSL certificates exist and back them up
log_info "Backing up existing SSL certificates..."
ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
if [ -d "/root/certbot/conf/live" ]; then
    mkdir -p /root/ssl_backup
    cp -r /root/certbot/conf/live/* /root/ssl_backup/
fi
ENDSSH

# Stop existing containers
log_info "Stopping existing containers..."
ssh "$SERVER_USER@$SERVER_IP" "cd /root && docker-compose down"

# Copy configuration files
log_info "Copying configuration files..."
scp docker-compose.yml nginx.conf .env "$SERVER_USER@$SERVER_IP:/root/"

# Start containers and set up SSL
log_info "Starting containers and setting up SSL..."
ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
cd /root

# Start nginx without SSL first
cat > nginx.conf.http << 'EOF'
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

mv nginx.conf.http nginx.conf
docker-compose up -d nginx

# Generate SSL certificates
if [ -d "/root/ssl_backup" ] && [ "$(ls -A /root/ssl_backup)" ]; then
    echo "Restoring SSL certificates from backup..."
    cp -r /root/ssl_backup/* /root/certbot/conf/live/
else
    echo "Generating new SSL certificates..."
    STAGING_FLAG=""
    if [ "${USE_STAGING}" = true ]; then
        STAGING_FLAG="--test-cert"
    fi
    
    docker-compose run --rm certbot certonly --webroot \
        --webroot-path /var/www/certbot \
        --email admin@notablenomads.com \
        --agree-tos --no-eff-email \
        -d api.notablenomads.com \
        $STAGING_FLAG
fi

# Restore full nginx configuration and restart
mv nginx.conf.bak nginx.conf
docker-compose restart nginx

# Start remaining services
docker-compose up -d
ENDSSH

log_info "Deployment completed successfully!"
echo -e "\n🌍 Your application should now be running at https://api.notablenomads.com"
echo -e "\n📝 Next steps:"
echo "1. Verify your domain's DNS A record points to: $SERVER_IP"
echo "2. Test the API endpoint: curl https://api.notablenomads.com/v1/health"
echo "3. Monitor the logs with: ssh $SERVER_USER@$SERVER_IP 'docker-compose logs -f'" 