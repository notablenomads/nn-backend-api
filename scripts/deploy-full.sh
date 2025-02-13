#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP="$1"
SERVER_USER="root"
API_DOMAIN="api.notablenomads.com"
FRONTEND_DOMAIN="notablenomads.com"
DOCKER_HUB_TOKEN="${DOCKER_HUB_TOKEN:-}"
AUTO_CONFIRM="${AUTO_CONFIRM:-false}"

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
    echo "Usage: DOCKER_HUB_TOKEN=<token> [AUTO_CONFIRM=true] $0 <server-ip>"
    echo
    echo "Options:"
    echo "  AUTO_CONFIRM=true    Skip confirmation prompts (useful for CI/CD)"
    exit 1
}

# Function to handle confirmations
confirm_step() {
    local step="$1"
    if [ "$AUTO_CONFIRM" != "true" ]; then
        read -p "Press Enter to continue with $step (or Ctrl+C to abort)..."
    else
        log_info "Auto-confirming $step..."
    fi
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
echo "Auto confirm: $AUTO_CONFIRM"
echo

confirm_step "Step 1: Cleanup"

# Function to test SSH connection
test_ssh_connection() {
    local retries=3
    local wait_time=5
    
    log_info "Testing SSH connection to $SERVER_USER@$SERVER_IP..."
    
    for ((i=1; i<=retries; i++)); do
        if ssh -o ConnectTimeout=10 \
           -o BatchMode=yes \
           -o StrictHostKeyChecking=accept-new \
           "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'" &> /dev/null; then
            log_success "SSH connection established successfully"
            return 0
        else
            log_warn "SSH connection attempt $i of $retries failed"
            if [ $i -lt $retries ]; then
                log_info "Waiting $wait_time seconds before retrying..."
                sleep $wait_time
            fi
        fi
    done
    
    log_error "Could not establish SSH connection to $SERVER_USER@$SERVER_IP after $retries attempts"
    return 1
}

# Step 1: Cleanup
log_info "Step 1: Cleaning up existing deployment..."

# Test SSH connection with retries
test_ssh_connection || exit 1

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

# Stop containers but keep volumes
log_info "Stopping all containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Remove all containers except postgres
log_info "Removing containers (except postgres)..."
docker ps -a | grep -v "postgres" | awk 'NR>1 {print $1}' | xargs -r docker rm -f

# Remove networks
log_info "Removing docker networks..."
docker network prune -f

# Remove volumes except postgres data
log_info "Removing docker volumes (except postgres data)..."
docker volume ls -q | grep -v "nn_postgres_data" | xargs -r docker volume rm 2>/dev/null || true

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
        log_warn "HTTPS check failed for $domain, retrying in 10 seconds... ($retry_count/$max_retries)"
        sleep 10
    done
    
    log_error "Failed to verify HTTPS endpoint for $domain after $max_retries attempts"
    return 1
}

# Check both domains
check_https_endpoint "$API_DOMAIN" true
check_https_endpoint "$FRONTEND_DOMAIN" false

log_success "Full deployment completed successfully!"
echo -e "\n📝 Next steps:"
echo "1. Monitor the logs: ssh $SERVER_USER@$SERVER_IP 'docker compose logs -f'"
echo "2. Test the API: curl https://$API_DOMAIN/v1/health"
echo "3. Visit the frontend: https://$FRONTEND_DOMAIN" 