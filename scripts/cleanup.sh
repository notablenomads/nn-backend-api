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

# Execute cleanup on remote server
ssh "$SERVER_USER@$SERVER_IP" << CLEANUP
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log_info() { echo -e "\${BLUE}[INFO]\${NC} \$1"; }
log_warn() { echo -e "\${YELLOW}[WARN]\${NC} \$1"; }
log_success() { echo -e "\${GREEN}[SUCCESS]\${NC} \$1"; }

cd /root

# Stop and remove all containers
log_info "Stopping all containers..."
docker-compose down -v || true
docker rm -f \$(docker ps -aq) 2>/dev/null || true

# Remove all docker networks
log_info "Removing docker networks..."
docker network prune -f

# Remove docker volumes
log_info "Removing docker volumes..."
docker volume rm \$(docker volume ls -q) 2>/dev/null || true

# Clean up SSL certificates and related files
if [ "$FORCE" = true ]; then
    log_warn "Removing all SSL certificates and related files..."
    rm -rf /etc/letsencrypt/live/$DOMAIN
    rm -rf /etc/letsencrypt/archive/$DOMAIN
    rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf
    rm -rf certbot/conf/*
    rm -rf certbot/www/*
    rm -rf certbot/logs/*
    rm -rf ssl_backup/*
else
    log_info "Backing up existing certificates..."
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        mkdir -p ssl_backup
        cp -rL /etc/letsencrypt/live/$DOMAIN ssl_backup/
        cp -r /etc/letsencrypt/archive/$DOMAIN ssl_backup/
        cp -r /etc/letsencrypt/renewal/$DOMAIN.conf ssl_backup/
    fi
fi

# Clean up nginx configuration
log_info "Cleaning up nginx configuration..."
rm -f nginx.conf.http nginx.conf.orig nginx.conf.bak

# Clean up docker login credentials
log_info "Removing Docker Hub credentials..."
docker logout

# Clean up temporary files
log_info "Cleaning up temporary files..."
rm -rf /tmp/* /var/tmp/*

# Clean up logs
log_info "Cleaning up logs..."
find /var/log -type f -name "*.log" -exec truncate -s 0 {} \;

log_success "Cleanup completed successfully!"
CLEANUP

log_success "Server cleanup completed successfully!"
if [ "$FORCE" = true ]; then
    log_warn "All certificates and data have been removed. You will need to generate new certificates on next deployment."
else
    log_info "SSL certificates have been backed up (if they existed)."
fi

echo -e "\n📝 Next steps:"
echo "1. Run the deployment script to redeploy the application:"
echo "   DOCKER_HUB_TOKEN=<token> ./scripts/deploy.sh $SERVER_IP [--production]"