#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP="$1"
SERVER_USER="root"
API_DOMAIN="api.notablenomads.com"
FRONTEND_DOMAIN="notablenomads.com"
DOCKER_HUB_TOKEN="${DOCKER_HUB_TOKEN:-}"

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
    echo "Usage: DOCKER_HUB_TOKEN=<token> $0 <server-ip>"
    exit 1
}

# Validate input parameters
if [ -z "$1" ]; then
    log_error "Server IP address is required."
    usage
fi

if [ -z "$DOCKER_HUB_TOKEN" ]; then
    log_error "DOCKER_HUB_TOKEN is not set. Please set it as an environment variable."
    echo "You can create a token at https://hub.docker.com/settings/security"
    exit 1
fi

log_info "Starting full deployment sequence for $API_DOMAIN and $FRONTEND_DOMAIN"
echo "Server IP: $SERVER_IP"
echo "Force cleanup: false"
echo "Force SSL regeneration: false"
echo

read -p "Press Enter to continue with Step 1: Cleanup (or Ctrl+C to abort)..."

# Step 1: Cleanup
log_info "Step 1: Cleaning up existing deployment..."
log_info "Checking SSH connection..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'" &> /dev/null; then
    log_error "Could not establish SSH connection to $SERVER_USER@$SERVER_IP"
    exit 1
fi

log_info "Starting cleanup process on $SERVER_IP..."

# Create and copy cleanup script
cat > remote_cleanup.sh << 'EOF'
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

cd /root || exit 1

# Stop and remove containers
log_info "Stopping all containers..."
docker compose down -v

# Remove all containers
log_info "Removing all containers..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

# Remove networks
log_info "Removing docker networks..."
docker network prune -f

# Remove volumes
log_info "Removing docker volumes..."
docker volume prune -f

# Remove unused images
log_info "Removing unused images..."
docker system prune -af

# Clean up Docker authentication
log_info "Cleaning up Docker authentication..."
docker logout

# Backup existing certificates
log_info "Backing up existing certificates..."
if [ -d "/etc/letsencrypt/live" ]; then
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="/root/letsencrypt_backup_$timestamp"
    mkdir -p "$backup_dir"
    cp -rp /etc/letsencrypt/live "$backup_dir/"
    cp -rp /etc/letsencrypt/archive "$backup_dir/"
fi

# Clean up nginx configuration
log_info "Cleaning up nginx configuration..."
rm -f /root/nginx.conf

# Clean up temporary files
log_info "Cleaning up temporary files..."
rm -rf /root/tmp/* 2>/dev/null || true

# Clean up logs
log_info "Cleaning up logs..."
find /var/log -type f -name "*.log" -exec truncate -s 0 {} \;

# Final Docker cleanup
log_info "Final Docker cleanup..."
docker system prune -f

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

# Copy and execute cleanup script
scp remote_cleanup.sh "$SERVER_USER@$SERVER_IP:/root/"
ssh "$SERVER_USER@$SERVER_IP" "chmod +x /root/remote_cleanup.sh && /root/remote_cleanup.sh"
rm remote_cleanup.sh

log_success "Server cleanup completed successfully!"
log_info "SSL certificates have been backed up (if they existed)."

# Step 2: Deploy with HTTPS
log_info "Step 2: Deploying with HTTPS configuration..."
DOCKER_HUB_TOKEN="$DOCKER_HUB_TOKEN" ./scripts/deploy.sh "$SERVER_IP"

# Step 3: Verify deployment
log_info "Step 3: Verifying deployment..."
log_info "Checking HTTPS endpoints..."

# Function to check HTTPS endpoint
check_https_endpoint() {
    local domain="$1"
    local max_retries=5
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -sk "https://$domain/v1/health" | grep -q "status.*ok"; then
            log_success "HTTPS endpoint for $domain is working"
            return 0
        fi
        retry_count=$((retry_count + 1))
        log_warn "HTTPS check failed for $domain, retrying in 10 seconds... ($retry_count/$max_retries)"
        sleep 10
    done
    
    log_error "Failed to verify HTTPS endpoint for $domain after $max_retries attempts"
    return 1
}

# Check both domains
check_https_endpoint "$API_DOMAIN"
check_https_endpoint "$FRONTEND_DOMAIN"

log_success "Full deployment completed successfully!"
echo -e "\n📝 Next steps:"
echo "1. Monitor the logs: ssh $SERVER_USER@$SERVER_IP 'docker compose logs -f'"
echo "2. Test the API: curl https://$API_DOMAIN/v1/health"
echo "3. Visit the frontend: https://$FRONTEND_DOMAIN" 