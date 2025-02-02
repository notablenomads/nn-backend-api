#!/bin/bash

# Exit on any error
set -e

# Configuration
DOMAIN="${DOMAIN:-api.notablenomads.com}"
EMAIL="admin@notablenomads.com"

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root"
    exit 1
fi

# Parse arguments
ACTION="check"
USE_STAGING=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --staging)
            USE_STAGING=true
            shift
            ;;
        --force-renew)
            ACTION="renew"
            shift
            ;;
        --new)
            ACTION="new"
            shift
            ;;
        *)
            log_error "Unknown argument: $1"
            echo "Usage: $0 [--staging] [--force-renew] [--new]"
            exit 1
            ;;
    esac
done

# Function to stop nginx container
stop_nginx() {
    log_info "Stopping nginx container..."
    docker-compose stop nginx || true
}

# Function to start nginx container
start_nginx() {
    log_info "Starting nginx container..."
    docker-compose up -d nginx
}

# Function to copy certificates to docker volume
copy_certs_to_volume() {
    log_info "Copying certificates to docker volume..."
    mkdir -p /root/certbot/conf
    cp -rL /etc/letsencrypt/* /root/certbot/conf/
}

case $ACTION in
    "check")
        if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
            log_info "Found existing certificates, checking expiry..."
            certbot certificates
            copy_certs_to_volume
        else
            log_warn "No existing certificates found"
            exit 1
        fi
        ;;
        
    "renew")
        if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
            log_info "Attempting to renew existing certificates..."
            stop_nginx
            certbot renew --force-renewal --non-interactive
            copy_certs_to_volume
            start_nginx
        else
            log_warn "No existing certificates found to renew"
            exit 1
        fi
        ;;
        
    "new")
        log_info "Generating new SSL certificates..."
        STAGING_FLAG=""
        if [ "$USE_STAGING" = true ]; then
            STAGING_FLAG="--test-cert"
            log_warn "Using staging environment"
        fi
        
        stop_nginx
        certbot certonly --standalone \
            --preferred-challenges http \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN" \
            $STAGING_FLAG \
            --non-interactive
            
        if [ $? -eq 0 ]; then
            copy_certs_to_volume
            start_nginx
            log_success "Successfully generated new certificates"
        else
            start_nginx
            log_error "Failed to generate certificates"
            exit 1
        fi
        ;;
esac

log_success "SSL certificate operation completed successfully!" 