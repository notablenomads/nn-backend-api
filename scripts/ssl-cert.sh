#!/bin/bash

# Exit on any error
set -e

# Configuration
DOMAIN="${DOMAIN:-api.notablenomads.com}"
EMAIL="admin@notablenomads.com"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
BACKUP_DIR="/root/ssl_backup/$DOMAIN"
CERTBOT_DIR="/etc/letsencrypt"
DOCKER_VOLUME_DIR="/root/certbot/conf"

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
CLEANUP=false

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
        --cleanup)
            CLEANUP=true
            shift
            ;;
        *)
            log_error "Unknown argument: $1"
            echo "Usage: $0 [--staging] [--force-renew] [--new] [--check] [--cleanup]"
            exit 1
            ;;
    esac
done

# Function to cleanup certificates and related files
cleanup_certs() {
    local domain="$1"
    log_info "Cleaning up certificates for $domain..."
    
    # Stop services first
    stop_services
    
    # Backup before cleanup
    backup_certs
    
    # Remove certbot certificates
    if [ -d "$CERTBOT_DIR/live/$domain" ]; then
        log_info "Removing certbot certificates for $domain..."
        rm -rf "$CERTBOT_DIR/live/$domain"
        rm -rf "$CERTBOT_DIR/archive/$domain"
        rm -rf "$CERTBOT_DIR/renewal/$domain.conf"
    fi
    
    # Remove from docker volume
    if [ -d "$DOCKER_VOLUME_DIR/live/$domain" ]; then
        log_info "Removing certificates from docker volume for $domain..."
        rm -rf "$DOCKER_VOLUME_DIR/live/$domain"
        rm -rf "$DOCKER_VOLUME_DIR/archive/$domain"
        rm -rf "$DOCKER_VOLUME_DIR/renewal/$domain.conf"
    fi
    
    log_success "Cleanup completed for $domain"
}

# Function to backup existing certificates
backup_certs() {
    if [ -d "$CERT_DIR" ]; then
        log_info "Backing up existing certificates..."
        local timestamp=$(date +%Y%m%d_%H%M%S)
        local backup_dir="$BACKUP_DIR/$timestamp"
        mkdir -p "$backup_dir"
        
        # Backup certificates
        if cp -rL "$CERT_DIR"/* "$backup_dir/"; then
            # Also backup renewal config
            if [ -f "$CERTBOT_DIR/renewal/$DOMAIN.conf" ]; then
                cp "$CERTBOT_DIR/renewal/$DOMAIN.conf" "$backup_dir/"
            fi
            log_success "Certificates backed up to $backup_dir"
        else
            log_warn "Failed to backup certificates"
        fi
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
    
    # Check certificate expiration
    local expiry_date=$(openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -enddate | cut -d= -f2)
    local expiry_epoch=$(date -d "$expiry_date" +%s)
    local current_epoch=$(date +%s)
    local days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))
    
    if [ $days_left -lt 30 ]; then
        log_warn "Certificate will expire in $days_left days"
    else
        log_info "Certificate valid for $days_left days"
    fi

    log_success "Certificate verification passed"
    return 0
}

# Function to stop services
stop_services() {
    log_info "Stopping services..."
    
    # Stop all Docker containers using ports 80 and 443
    if docker ps -q -f "publish=80" -f "publish=443" | grep -q .; then
        log_info "Stopping Docker containers using ports 80/443..."
        docker stop $(docker ps -q -f "publish=80" -f "publish=443") || true
    fi
    
    # Wait for ports to be free
    local retries=0
    while [ $retries -lt 5 ]; do
        if ! lsof -i:80 -i:443 > /dev/null 2>&1; then
            log_success "Ports 80 and 443 are free"
            return 0
        fi
        log_info "Waiting for ports to be free..."
        sleep 2
        ((retries++))
    done
    
    log_warn "Ports may not be completely free"
}

# Function to start services
start_services() {
    log_info "Starting services..."
    
    # Start Docker containers
    if ! docker compose up -d nginx certbot; then
        log_error "Failed to start Docker containers"
        return 1
    fi
    
    # Wait for services to be healthy
    local retries=0
    while [ $retries -lt 10 ]; do
        if docker compose ps | grep -q "healthy"; then
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
    local target_dir="$DOCKER_VOLUME_DIR/live/$DOMAIN"
    mkdir -p "$target_dir"
    
    # Ensure source certificates exist
    if [ ! -d "$CERT_DIR" ]; then
        log_error "Source certificates directory does not exist"
        return 1
    fi
    
    # Copy with preservation of permissions and links
    cp -rL "$CERT_DIR"/* "$target_dir/"
    
    # Copy renewal configuration
    if [ -f "$CERTBOT_DIR/renewal/$DOMAIN.conf" ]; then
        mkdir -p "$DOCKER_VOLUME_DIR/renewal"
        cp "$CERTBOT_DIR/renewal/$DOMAIN.conf" "$DOCKER_VOLUME_DIR/renewal/"
    fi
    
    # Verify copy
    if ! diff -r "$CERT_DIR" "$target_dir" > /dev/null 2>&1; then
        log_error "Certificate copy verification failed"
        return 1
    fi
    
    # Set proper permissions
    chmod -R 644 "$target_dir"
    find "$target_dir" -type d -exec chmod 755 {} \;
    
    log_success "Certificates copied successfully"
}

# Function to generate new certificates
generate_certs() {
    log_info "Generating new certificates for $DOMAIN..."
    
    # Stop services to free up ports
    stop_services
    
    # Ensure ports are available
    if lsof -i:80 -i:443 > /dev/null 2>&1; then
        log_error "Ports 80/443 are still in use"
        return 1
    fi
    
    # Prepare certbot command
    local certbot_cmd="certbot certonly --standalone --preferred-challenges http"
    
    # Add staging flag if requested
    if [ "$USE_STAGING" = true ]; then
        certbot_cmd="$certbot_cmd --test-cert"
    fi
    
    # Add domain and email
    certbot_cmd="$certbot_cmd -d $DOMAIN --email $EMAIL --agree-tos --non-interactive"
    
    # Run certbot
    if $certbot_cmd; then
        log_success "Certificate generation successful"
        copy_certs_to_volume
        verify_certs
        start_services
    else
        log_error "Certificate generation failed"
        start_services
        return 1
    fi
}

# Handle cleanup if requested
if [ "$CLEANUP" = true ]; then
    cleanup_certs "$DOMAIN"
    log_success "Cleanup completed"
    exit 0
fi

case "$ACTION" in
    "check")
        verify_certs
        ;;
    "renew")
        certbot renew --force-renewal
        copy_certs_to_volume
        verify_certs
        ;;
    "new")
        generate_certs
        ;;
    *)
        log_error "Unknown action: $ACTION"
        exit 1
        ;;
esac

# Start services
start_services

log_success "SSL certificate management completed!"