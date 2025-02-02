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
    docker-compose stop nginx frontend || true
    
    # Wait for services to stop
    local retries=0
    while [ $retries -lt 5 ]; do
        if ! docker-compose ps | grep -q "Up"; then
            log_success "Services stopped"
            return 0
        fi
        log_info "Waiting for services to stop..."
        sleep 2
        ((retries++))
    done
    
    log_warn "Services may not have stopped properly"
}

# Function to start services
start_services() {
    log_info "Starting services..."
    docker-compose up -d nginx frontend
    
    # Wait for services to be healthy
    local retries=0
    while [ $retries -lt 10 ]; do
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

# Handle cleanup if requested
if [ "$CLEANUP" = true ]; then
    cleanup_certs "$DOMAIN"
    log_success "Cleanup completed"
    exit 0
fi

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
            
            # Attempt renewal
            if certbot renew --force-renewal --non-interactive; then
                if verify_certs && copy_certs_to_volume; then
                    start_services
                    log_success "Certificate renewal completed successfully"
                else
                    log_error "Certificate renewal failed during verification"
                    start_services
                    exit 1
                fi
            else
                log_error "Certificate renewal failed"
                start_services
                exit 1
            fi
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
        
        # Ensure port 80 is available
        if lsof -i:80 > /dev/null 2>&1; then
            log_warn "Port 80 is in use, attempting to free it..."
            fuser -k 80/tcp || true
            sleep 2
        fi
        
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