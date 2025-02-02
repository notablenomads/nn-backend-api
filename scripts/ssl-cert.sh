#!/bin/bash

# Exit on any error
set -e

# Configuration
DOMAIN="${DOMAIN:-api.notablenomads.com}"
EMAIL="admin@notablenomads.com"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
BACKUP_DIR="/root/ssl_backup/$DOMAIN"

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
        --check)
            ACTION="check"
            shift
            ;;
        *)
            log_error "Unknown argument: $1"
            echo "Usage: $0 [--staging] [--force-renew] [--new] [--check]"
            exit 1
            ;;
    esac
done

# Function to backup existing certificates
backup_certs() {
    if [ -d "$CERT_DIR" ]; then
        log_info "Backing up existing certificates..."
        mkdir -p "$BACKUP_DIR"
        cp -rL "$CERT_DIR"/* "$BACKUP_DIR/"
        log_success "Certificates backed up to $BACKUP_DIR"
    fi
}

# Function to verify certificates
verify_certs() {
    if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ]; then
        log_error "Certificate files are missing"
        return 1
    fi

    # Verify certificate validity
    openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -text > /dev/null 2>&1 || {
        log_error "Invalid certificate"
        return 1
    }

    log_success "Certificate verification passed"
    return 0
}

# Function to stop services
stop_services() {
    log_info "Stopping services..."
    docker-compose stop nginx frontend || true
}

# Function to start services
start_services() {
    log_info "Starting services..."
    docker-compose up -d nginx frontend
    
    # Wait for services to be healthy
    local retries=0
    while [ $retries -lt 5 ]; do
        if docker-compose ps | grep -q "healthy"; then
            log_success "Services are healthy"
            return 0
        fi
        log_info "Waiting for services to be healthy..."
        sleep 5
        ((retries++))
    done
    
    log_warn "Services started but health check timed out"
}

# Function to copy certificates to docker volume
copy_certs_to_volume() {
    log_info "Copying certificates to docker volume..."
    local target_dir="/root/certbot/conf/live/$DOMAIN"
    mkdir -p "$target_dir"
    cp -rL "$CERT_DIR"/* "$target_dir/"
    
    # Verify copy
    if ! diff -r "$CERT_DIR" "$target_dir" > /dev/null 2>&1; then
        log_error "Certificate copy verification failed"
        return 1
    fi
    
    log_success "Certificates copied successfully"
}

case $ACTION in
    "check")
        if [ -d "$CERT_DIR" ]; then
            log_info "Found existing certificates, checking expiry..."
            certbot certificates
            verify_certs && copy_certs_to_volume
        else
            log_warn "No existing certificates found"
            exit 1
        fi
        ;;
        
    "renew")
        if [ -d "$CERT_DIR" ]; then
            log_info "Attempting to renew existing certificates..."
            backup_certs
            stop_services
            certbot renew --force-renewal --non-interactive
            verify_certs && copy_certs_to_volume
            start_services
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
        
        backup_certs
        stop_services
        
        certbot certonly --standalone \
            --preferred-challenges http \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            -d "$DOMAIN" \
            $STAGING_FLAG \
            --non-interactive
            
        if verify_certs && copy_certs_to_volume; then
            start_services
            log_success "Successfully generated new certificates"
        else
            start_services
            log_error "Failed to generate or copy certificates"
            exit 1
        fi
        ;;
esac

log_success "SSL certificate operation completed successfully!" 