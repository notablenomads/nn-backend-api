#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions with timestamps
log_info() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[INFO]${NC} [$timestamp] $1" | tee -a "/tmp/deploy-full.log"
}

log_warn() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARN]${NC} [$timestamp] $1" | tee -a "/tmp/deploy-full.log"
}

log_error() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR]${NC} [$timestamp] $1" >&2 | tee -a "/tmp/deploy-full.log"
}

log_success() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[SUCCESS]${NC} [$timestamp] $1" | tee -a "/tmp/deploy-full.log"
}

# Confirmation handler
confirm_step() {
    local step="$1"
    if [ "$AUTO_CONFIRM" != "true" ]; then
        read -p "Press Enter to continue with $step (or Ctrl+C to abort)..."
    else
        log_info "Auto-confirming $step..."
    fi
}

# Health check function
check_https_endpoint() {
    local domain="$1"
    local is_api="$2"
    local max_retries=5
    local retry_count=0
    local endpoint
    
    if [ "$is_api" = true ]; then
        endpoint="https://$domain/v1/health"
        success_pattern="status.*ok"
    else
        endpoint="https://$domain"
        success_pattern="200"
    fi
    
    log_info "Checking HTTPS endpoint: $endpoint"
    while [ $retry_count -lt $max_retries ]; do
        if [ "$is_api" = true ]; then
            if curl -sk "$endpoint" | grep -q "$success_pattern"; then
                log_success "HTTPS endpoint for $domain is working"
                return 0
            fi
        else
            if curl -sk -o /dev/null -w "%{http_code}" "$endpoint" | grep -q "$success_pattern"; then
                log_success "HTTPS endpoint for $domain is working"
                return 0
            fi
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            log_warn "Retry $retry_count/$max_retries: Endpoint not ready yet, waiting..."
            sleep 10
        fi
    done
    
    log_error "Failed to verify HTTPS endpoint: $endpoint after $max_retries attempts"
    return 1
}

# Backup function
perform_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="/root/backups/$timestamp"
    
    log_info "Creating backup at $backup_dir"
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # Backup SSL certificates if they exist
    if [ -d "/etc/letsencrypt/live" ]; then
        log_info "Backing up SSL certificates..."
        cp -rp /etc/letsencrypt/live "$backup_dir/"
        cp -rp /etc/letsencrypt/archive "$backup_dir/"
    fi
    
    # Backup nginx configuration if it exists
    if [ -f "/root/nginx.conf" ]; then
        log_info "Backing up nginx configuration..."
        cp -p /root/nginx.conf "$backup_dir/"
    fi
    
    log_success "Backup completed at $backup_dir"
    return 0
}

# Verify SSH connection
verify_ssh_connection() {
    local server_user="$1"
    local server_ip="$2"
    
    log_info "Checking SSH connection..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$server_user@$server_ip" "echo 'SSH connection successful'" &> /dev/null; then
        log_error "Could not establish SSH connection to $server_user@$server_ip"
        return 1
    fi
    log_success "SSH connection verified"
    return 0
}

# Progress tracking
init_progress() {
    export TOTAL_STEPS="$1"
    export CURRENT_STEP=0
}

progress() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    log_info "[$CURRENT_STEP/$TOTAL_STEPS] $1"
}
