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
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

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
    log_warn "Using staging environment for SSL certificates"
fi

# Step 1: Verify DNS configuration
log_info "Step 1: Verifying DNS configuration"
log_info "Verifying DNS configuration for $DOMAIN..."

# Check DNS A record
log_info "Checking DNS A record..."
CURRENT_IP=$(dig +short $DOMAIN)

if [ -z "$CURRENT_IP" ]; then
    log_error "No DNS A record found for $DOMAIN"
    exit 1
fi

if [ "$CURRENT_IP" != "$SERVER_IP" ]; then
    log_error "DNS A record points to $CURRENT_IP, but server IP is $SERVER_IP"
    exit 1
fi

log_success "DNS configuration is correct!"

# Check required commands
check_command "docker"
check_command "ssh"
check_command "scp"

# Step 2: Build and push Docker image
log_info "Step 2: Building and pushing Docker image"
docker build -t "$DOCKER_HUB_USERNAME/$APP_NAME:latest" .

log_info "Logging in to Docker Hub..."
docker login

log_info "Pushing image to Docker Hub..."
docker push "$DOCKER_HUB_USERNAME/$APP_NAME:latest"

log_info "Logging out from Docker Hub..."
docker logout

log_success "Successfully built and pushed image $DOCKER_HUB_USERNAME/$APP_NAME:latest"

# Step 3: Set up server
log_info "Step 3: Setting up server"
check_ssh_connection "$SERVER_USER@$SERVER_IP"

# Create required directories
log_info "Creating required directories..."
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p /root/certbot/conf /root/certbot/www /root/certbot/logs /root/ssl_backup"

# Copy configuration files
log_info "Copying configuration files..."
scp docker-compose.yml nginx.conf .env "$SERVER_USER@$SERVER_IP:/root/"

# Step 4: Set up SSL and deploy application
log_info "Step 4: Setting up SSL and deploying application"
ssh "$SERVER_USER@$SERVER_IP" << EOF
cd /root

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose down

# Create temporary nginx configuration for HTTP challenge
cat > nginx.conf.http << 'NGINX_CONF'
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files \$uri =404;
    }

    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
NGINX_CONF

# Backup existing nginx configuration
cp nginx.conf nginx.conf.orig
mv nginx.conf.http nginx.conf

# Start nginx with HTTP configuration
log_info "Starting Nginx with HTTP configuration..."
docker-compose up -d nginx

# Wait for Nginx to start
sleep 5

# Handle SSL certificates
if [ -d "/root/certbot/conf/live/$DOMAIN" ] && [ -n "\$(ls -A /root/certbot/conf/live/$DOMAIN)" ]; then
    log_info "Found existing SSL certificates, backing them up..."
    rm -rf /root/ssl_backup/*
    cp -rL /root/certbot/conf/live/* /root/ssl_backup/
    cp -r /root/certbot/conf/archive /root/ssl_backup/
    cp -r /root/certbot/conf/renewal /root/ssl_backup/
else
    log_info "Requesting new SSL certificate..."
    STAGING_FLAG=""
    if [ "$USE_STAGING" = true ]; then
        STAGING_FLAG="--test-cert"
        log_warn "Using staging environment for SSL certificates"
    else
        log_info "Using production environment for SSL certificates"
    fi
    
    docker-compose run --rm certbot certonly \
        --webroot \
        --webroot-path /var/www/certbot \
        --email admin@notablenomads.com \
        --agree-tos --no-eff-email \
        -d $DOMAIN \
        \$STAGING_FLAG
fi

# Restore full nginx configuration
log_info "Restoring full Nginx configuration..."
mv nginx.conf.orig nginx.conf

# Start all services
log_info "Starting all services..."
docker-compose up -d

# Wait for services to start
sleep 10

# Verify deployment
log_info "Verifying deployment..."

# Check container status
log_info "Container Status:"
docker-compose ps

# Check container logs
log_info "Container Logs:"
docker-compose logs --tail=50

# Check ports
log_info "Checking ports:"
netstat -tulpn | grep -E ':80|:443|:3000'

# Test API directly
log_info "Testing API directly:"
curl -k https://localhost/v1/health

# Test through Nginx
log_info "Testing through Nginx:"
curl -k https://$DOMAIN/v1/health

# Check SSL certificate
log_info "Checking SSL certificate:"
echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates
EOF

log_success "Deployment completed successfully!"
echo -e "\n🌍 Your application should now be running at https://$DOMAIN"
echo -e "\n📝 Next steps:"
echo "1. Verify your domain's DNS A record points to: $SERVER_IP"
echo "2. Test the API endpoint: curl -k https://$DOMAIN/v1/health"
echo "3. Monitor the logs with: ssh $SERVER_USER@$SERVER_IP 'docker-compose logs -f'"

if [ "$USE_STAGING" = true ]; then
    echo -e "\n${YELLOW}Note: SSL certificates are in staging mode. Run with --production for valid certificates.${NC}"
fi