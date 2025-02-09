#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_USER="root"
DOMAIN="api.notablenomads.com"

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

# Validate input parameters
if [ -z "$1" ]; then
    log_error "Server IP address is required."
    echo "Usage: $0 <server-ip> [--force]"
    exit 1
fi

SERVER_IP="$1"
FORCE=false

# Check if --force flag is provided
if [ "$2" = "--force" ]; then
    FORCE=true
    log_warn "Force mode enabled - will remove all certificates and data"
fi

# Check SSH connection
log_info "Checking SSH connection..."
if ! ssh -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'" &> /dev/null; then
    log_error "Could not establish SSH connection to $SERVER_USER@$SERVER_IP"
    exit 1
fi

log_info "Starting cleanup process on $SERVER_IP..."

# Create remote cleanup script
cat > /tmp/remote_cleanup.sh << 'EOF'
#!/bin/bash

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

cd /root

# Stop all running containers
log_info "Stopping all containers..."
docker compose down || true

# Remove all containers except postgres
log_info "Removing containers (except postgres)..."
docker ps -a | grep -v "postgres" | awk 'NR>1 {print $1}' | xargs -r docker rm -f

# Remove all docker networks
log_info "Removing docker networks..."
docker network prune -f

# Remove all docker volumes except postgres data
log_info "Removing docker volumes (except postgres data)..."
docker volume ls -q | grep -v "nn_postgres_data" | xargs -r docker volume rm 2>/dev/null || true

# Remove all unused images
log_info "Removing unused images..."
docker image prune -af

# Clean up Docker authentication
log_info "Cleaning up Docker authentication..."
rm -rf ~/.docker/config.json || true
docker logout

# Remove SSL certificates if in force mode
if [ "$FORCE" = true ]; then
    log_warn "Force mode: Removing SSL certificates..."
    rm -rf /etc/letsencrypt/live/* /etc/letsencrypt/archive/* /etc/letsencrypt/renewal/*
    rm -rf /etc/nginx/ssl/*
fi

# Remove nginx configuration
log_info "Removing nginx configuration..."
rm -rf /etc/nginx/conf.d/*

log_success "Cleanup completed!"
EOF

# Copy and execute the cleanup script on the remote server
log_info "Copying cleanup script to remote server..."
scp /tmp/remote_cleanup.sh "$SERVER_USER@$SERVER_IP:/tmp/remote_cleanup.sh"

log_info "Making cleanup script executable..."
ssh "$SERVER_USER@$SERVER_IP" "chmod +x /tmp/remote_cleanup.sh"

log_info "Executing cleanup script..."
if [ "$FORCE" = true ]; then
    ssh "$SERVER_USER@$SERVER_IP" "FORCE=true /tmp/remote_cleanup.sh"
else
    ssh "$SERVER_USER@$SERVER_IP" "/tmp/remote_cleanup.sh"
fi

log_info "Removing temporary cleanup script..."
ssh "$SERVER_USER@$SERVER_IP" "rm -f /tmp/remote_cleanup.sh"

log_success "Remote cleanup completed successfully!"