#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP=""
SERVER_USER="root"

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

case "$1" in
    --set)
        if [ -z "$2" ]; then
            log_error "No KEY=VALUE provided"
            usage
        fi
        KEY=$(echo $2 | cut -d= -f1)
        VALUE=$(echo $2 | cut -d= -f2)
        
        # Update local .env
        if grep -q "^${KEY}=" .env; then
            sed -i "" "s|^${KEY}=.*|${KEY}=${VALUE}|" .env
        else
            echo "${KEY}=${VALUE}" >> .env
        fi
        
        # Copy to server
        scp .env "$SERVER_USER@$SERVER_IP:/root/"
        
        # Restart services
        ssh "$SERVER_USER@$SERVER_IP" "cd /root && docker compose restart"
        
        log_success "Environment variable ${KEY} updated and services restarted"
        ;;
        
    --get)
        if [ -z "$2" ]; then
            log_error "No KEY provided"
            usage
        fi
        VALUE=$(grep "^$2=" .env | cut -d= -f2)
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
        ssh "$SERVER_USER@$SERVER_IP" "cat /root/.env"
        ;;
        
    --backup)
        BACKUP_FILE="env_backup_$(date +%Y%m%d_%H%M%S).env"
        cp .env "$BACKUP_FILE"
        log_success "Environment backup created: $BACKUP_FILE"
        ;;
        
    --restore)
        if [ -z "$2" ] || [ ! -f "$2" ]; then
            log_error "Backup file not found: $2"
            usage
        fi
        cp "$2" .env
        scp .env "$SERVER_USER@$SERVER_IP:/root/"
        ssh "$SERVER_USER@$SERVER_IP" "cd /root && docker compose restart"
        log_success "Environment restored from $2 and services restarted"
        ;;
        
    *)
        usage
        ;;
esac 