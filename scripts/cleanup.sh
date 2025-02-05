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
docker compose down -v || true

# Remove all containers
log_info "Removing all containers..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

# Remove all docker networks
log_info "Removing docker networks..."
docker network prune -f

# Remove all docker volumes
log_info "Removing docker volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# Remove all unused images
log_info "Removing unused images..."
docker image prune -af

# Clean up Docker authentication
log_info "Cleaning up Docker authentication..."
rm -rf ~/.docker/config.json || true
docker logout

# Clean up SSL certificates and related files
if [ "$1" = "true" ]; then
    log_warn "Removing all SSL certificates and related files..."
    rm -rf /etc/letsencrypt/live/*
    rm -rf /etc/letsencrypt/archive/*
    rm -rf /etc/letsencrypt/renewal/*
    rm -rf certbot/conf/*
    rm -rf certbot/www/*
    rm -rf certbot/logs/*
    rm -rf ssl_backup/*
else
    log_info "Backing up existing certificates..."
    mkdir -p ssl_backup
    if [ -d "/etc/letsencrypt/live" ]; then
        cp -rL /etc/letsencrypt/live/* ssl_backup/ 2>/dev/null || true
    fi
fi

# Clean up nginx configuration
log_info "Cleaning up nginx configuration..."
rm -f nginx.conf.http nginx.conf.orig nginx.conf.bak nginx.conf

# Clean up temporary files
log_info "Cleaning up temporary files..."
rm -rf /tmp/* /var/tmp/*

# Clean up logs
log_info "Cleaning up logs..."
find /var/log -type f -name "*.log" -exec truncate -s 0 {} \;

# Clean up any remaining Docker resources
log_info "Final Docker cleanup..."
docker system prune -af --volumes

# Verify cleanup
log_info "Verifying cleanup..."
echo "Containers:"
docker ps -a
echo "Volumes:"
docker volume ls
echo "Networks:"
docker network ls
echo "Images:"
docker images

log_success "Cleanup completed successfully!"
EOF

# Copy cleanup script to remote server
scp /tmp/remote_cleanup.sh "$SERVER_USER@$SERVER_IP:/tmp/cleanup.sh"

# Execute cleanup script on remote server
ssh "$SERVER_USER@$SERVER_IP" "chmod +x /tmp/cleanup.sh && /tmp/cleanup.sh $FORCE"

# Clean up local temporary file
rm /tmp/remote_cleanup.sh

log_success "Server cleanup completed successfully!"
if [ "$FORCE" = true ]; then
    log_warn "All certificates and data have been removed. You will need to generate new certificates on next deployment."
else
    log_info "SSL certificates have been backed up (if they existed)."
fi

echo -e "\n📝 Next steps:"
echo "1. Run the deployment script with HTTP-only configuration first:"
echo "   DOCKER_HUB_TOKEN=<token> ./scripts/deploy.sh $SERVER_IP --http-only"
echo "2. Then set up SSL certificates:"
echo "   ./scripts/manage-ssl.sh $SERVER_IP --production"
echo "3. Finally, deploy with HTTPS:"
echo "   DOCKER_HUB_TOKEN=<token> ./scripts/deploy.sh $SERVER_IP --production"