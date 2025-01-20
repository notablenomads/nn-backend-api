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
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[0;33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
    exit 1
}

# Check if required commands exist
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "Required command '$1' not found. Please install it first."
    fi
}

# Check if SSH connection works
check_ssh_connection() {
    if ! ssh -o ConnectTimeout=10 $1 "exit" &> /dev/null; then
        log_error "Cannot establish SSH connection to $1"
    fi
}

# Validate input parameters
if [ "$#" -lt 1 ]; then
    log_error "Usage: $0 <server_ip> [--production]"
fi

SERVER_IP=$1
USE_STAGING=true

# Check if production flag is set
if [ "$2" = "--production" ]; then
    USE_STAGING=false
    log_info "Using production environment for SSL certificates"
else
    log_warn "Using staging environment for SSL certificates. Use --production flag to switch to production."
fi

# Check required commands
check_command "docker"
check_command "ssh"
check_command "scp"

# Verify SSH connection
check_ssh_connection "$SERVER_USER@$SERVER_IP"

# Build and push Docker image
log_info "Building Docker image..."
docker build -t mrdevx/nn-backend-api:latest .
docker push mrdevx/nn-backend-api:latest

# Create backup directory on server
log_info "Setting up server configuration..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    # Helper functions for remote execution
    log_info() {
        echo -e "\033[0;34m[INFO]\033[0m $1"
    }

    log_warn() {
        echo -e "\033[0;33m[WARN]\033[0m $1"
    }

    # Create backup directory
    mkdir -p /root/ssl_backup
    
    # Backup existing SSL certificates if they exist
    if [ -d "/root/certbot/conf/live" ]; then
        log_info "Backing up existing SSL certificates..."
        cp -r /root/certbot/conf/live/* /root/ssl_backup/
    else
        log_warn "No existing SSL certificates found."
    fi

    # Stop existing containers
    if [ -f "/root/docker-compose.yml" ]; then
        log_info "Stopping existing containers..."
        docker-compose down
    fi
ENDSSH

# Copy configuration files
log_info "Copying configuration files..."
scp -o ConnectTimeout=60 docker-compose.yml nginx.conf .env $SERVER_USER@$SERVER_IP:/root/

# Start containers and set up SSL
log_info "Starting containers and setting up SSL..."
USE_STAGING_VALUE=$USE_STAGING
ssh $SERVER_USER@$SERVER_IP << ENDSSH
    # Helper functions for remote execution
    log_info() {
        echo -e "\033[0;34m[INFO]\033[0m \$1"
    }

    log_warn() {
        echo -e "\033[0;33m[WARN]\033[0m \$1"
    }

    # Create required directories
    mkdir -p /root/certbot/conf
    mkdir -p /root/certbot/www

    # Start nginx container
    log_info "Starting containers..."
    docker-compose up -d nginx

    # Restore SSL certificates if they exist in backup
    if [ -d "/root/ssl_backup" ] && [ "\$(ls -A /root/ssl_backup)" ]; then
        log_info "Restoring SSL certificates from backup..."
        mkdir -p /root/certbot/conf/live
        cp -r /root/ssl_backup/* /root/certbot/conf/live/
        docker-compose restart nginx
    else
        log_info "Generating new SSL certificates..."
        # Add staging flag if not in production
        STAGING_FLAG=""
        if [ "$USE_STAGING_VALUE" = true ]; then
            STAGING_FLAG="--test-cert"
        fi

        # Request SSL certificate
        docker-compose run --rm certbot certonly \
            \$STAGING_FLAG \
            --webroot \
            --webroot-path /var/www/certbot \
            --email admin@notablenomads.com \
            --agree-tos \
            --no-eff-email \
            -d api.notablenomads.com
    fi

    # Start remaining services
    log_info "Starting remaining services..."
    docker-compose up -d
ENDSSH

log_info "Deployment completed successfully!"
if [ "$USE_STAGING" = true ]; then
    log_warn "SSL certificates are from staging environment and will show as untrusted"
    log_warn "Once you verify everything works, run again with --production flag"
fi

echo -e "
🌍 Your application should now be running at https://$DOMAIN

📝 Next steps:
1. Verify your domain's DNS A record points to: $SERVER_IP
2. Test the API endpoint: curl https://$DOMAIN/v1/health
3. Monitor the logs with: ssh $SERVER_USER@$SERVER_IP 'docker-compose logs -f'
" 