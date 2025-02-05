#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP=""
SERVER_USER="root"
REMOTE_ENV_PATH="/root/secrets/.env"
DOCKER_COMPOSE_CMD="docker compose"

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

# Print usage
usage() {
    echo "Usage: $0 <server-ip> [--set KEY=VALUE] [--get KEY] [--list] [--backup] [--restore backup_file]"
    echo
    echo "Options:"
    echo "  --set KEY=VALUE    Set or update an environment variable"
    echo "  --get KEY          Get the value of an environment variable"
    echo "  --list            List all environment variables"
    echo "  --backup          Create a backup of current environment variables"
    echo "  --restore FILE    Restore environment variables from a backup file"
    exit 1
}

# Check if command exists on remote server
check_remote_command() {
    if ! ssh "$SERVER_USER@$SERVER_IP" "command -v $1" &>/dev/null; then
        log_error "Command '$1' not found on remote server"
        return 1
    fi
    return 0
}

# Ensure remote directory exists
ensure_remote_dir() {
    local dir="$1"
    ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $dir && chmod 700 $dir"
}

# Restart services safely
restart_services() {
    log_info "Restarting services..."
    
    # Check if docker compose is available
    if ! check_remote_command "docker"; then
        log_error "Docker is not installed on the remote server"
        return 1
    fi

    # Try docker compose v2
    if ssh "$SERVER_USER@$SERVER_IP" "docker compose version" &>/dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        log_error "Docker compose v2 is not available"
        return 1
    fi

    # Stop services gracefully
    log_info "Stopping services..."
    if ! ssh "$SERVER_USER@$SERVER_IP" "cd /root && $DOCKER_COMPOSE_CMD stop"; then
        log_error "Failed to stop services"
        return 1
    fi

    # Start services
    log_info "Starting services..."
    if ! ssh "$SERVER_USER@$SERVER_IP" "cd /root && $DOCKER_COMPOSE_CMD up -d"; then
        log_error "Failed to start services"
        return 1
    }

    # Check service health
    log_info "Checking service health..."
    local timeout=30
    while [ $timeout -gt 0 ]; do
        if ssh "$SERVER_USER@$SERVER_IP" "cd /root && $DOCKER_COMPOSE_CMD ps --format json" | grep -q "running"; then
            log_success "Services are running"
            return 0
        fi
        sleep 1
        timeout=$((timeout-1))
    done

    log_error "Services failed to start properly"
    ssh "$SERVER_USER@$SERVER_IP" "cd /root && $DOCKER_COMPOSE_CMD logs"
    return 1
}

# Validate input parameters
if [ -z "$1" ]; then
    log_error "Server IP address is required."
    usage
fi

SERVER_IP="$1"
shift

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_error ".env file not found in current directory"
    exit 1
fi

# Ensure remote secrets directory exists
ensure_remote_dir "/root/secrets"

case "$1" in
    --set)
        if [ -z "$2" ]; then
            log_error "No KEY=VALUE provided"
            usage
        fi
        KEY=$(echo $2 | cut -d= -f1)
        VALUE=$(echo $2 | cut -d= -f2)
        
        # Create backup before modification
        log_info "Creating backup before modification..."
        BACKUP_FILE="env_backup_$(date +%Y%m%d_%H%M%S).env"
        scp "$SERVER_USER@$SERVER_IP:$REMOTE_ENV_PATH" "$BACKUP_FILE" || true
        
        # Update local .env
        if grep -q "^${KEY}=" .env; then
            sed -i "" "s|^${KEY}=.*|${KEY}=${VALUE}|" .env
        else
            echo "${KEY}=${VALUE}" >> .env
        fi
        
        # Copy to server
        log_info "Copying environment file to server..."
        scp .env "$SERVER_USER@$SERVER_IP:$REMOTE_ENV_PATH"
        ssh "$SERVER_USER@$SERVER_IP" "chmod 600 $REMOTE_ENV_PATH"
        
        # Create symlink for compatibility
        ssh "$SERVER_USER@$SERVER_IP" "ln -sf $REMOTE_ENV_PATH /root/.env"
        
        # Restart services
        if ! restart_services; then
            log_error "Failed to restart services. Rolling back changes..."
            [ -f "$BACKUP_FILE" ] && scp "$BACKUP_FILE" "$SERVER_USER@$SERVER_IP:$REMOTE_ENV_PATH"
            restart_services
            exit 1
        fi
        
        log_success "Environment variable ${KEY} updated and services restarted"
        ;;
        
    --get)
        if [ -z "$2" ]; then
            log_error "No KEY provided"
            usage
        fi
        VALUE=$(ssh "$SERVER_USER@$SERVER_IP" "grep '^$2=' $REMOTE_ENV_PATH" | cut -d= -f2)
        if [ -z "$VALUE" ]; then
            log_error "Variable $2 not found"
            exit 1
        fi
        echo "$VALUE"
        ;;
        
    --list)
        log_info "Local environment variables:"
        cat .env
        
        log_info "\nServer environment variables:"
        ssh "$SERVER_USER@$SERVER_IP" "cat $REMOTE_ENV_PATH"
        ;;
        
    --backup)
        BACKUP_FILE="env_backup_$(date +%Y%m%d_%H%M%S).env"
        scp "$SERVER_USER@$SERVER_IP:$REMOTE_ENV_PATH" "$BACKUP_FILE"
        log_success "Environment backup created: $BACKUP_FILE"
        ;;
        
    --restore)
        if [ -z "$2" ] || [ ! -f "$2" ]; then
            log_error "Backup file not found: $2"
            usage
        fi
        
        # Create backup before restore
        BACKUP_FILE="env_backup_before_restore_$(date +%Y%m%d_%H%M%S).env"
        scp "$SERVER_USER@$SERVER_IP:$REMOTE_ENV_PATH" "$BACKUP_FILE" || true
        
        # Copy backup to server
        scp "$2" "$SERVER_USER@$SERVER_IP:$REMOTE_ENV_PATH"
        ssh "$SERVER_USER@$SERVER_IP" "chmod 600 $REMOTE_ENV_PATH"
        
        # Create symlink for compatibility
        ssh "$SERVER_USER@$SERVER_IP" "ln -sf $REMOTE_ENV_PATH /root/.env"
        
        # Restart services
        if ! restart_services; then
            log_error "Failed to restart services. Rolling back changes..."
            [ -f "$BACKUP_FILE" ] && scp "$BACKUP_FILE" "$SERVER_USER@$SERVER_IP:$REMOTE_ENV_PATH"
            restart_services
            exit 1
        fi
        
        log_success "Environment restored from $2 and services restarted"
        ;;
        
    *)
        usage
        ;;
esac 