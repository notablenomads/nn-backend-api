#!/bin/bash

# Exit on any error
set -e

# Load common functions and configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/config.sh"

# Initialize configuration
init_config

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -f|--force)
            AUTO_CONFIRM=true
            shift
            ;;
        --skip-cleanup)
            SKIP_CLEANUP=true
            shift
            ;;
        --skip-ssl)
            SKIP_SSL=true
            shift
            ;;
        --backup-only)
            BACKUP_ONLY=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            SERVER_IP="$1"
            shift
            ;;
    esac
done

# Show help function
show_help() {
    cat << EOF
Deploy Full Script
=================

Performs a full deployment of the Notable Nomads application.

Usage:
    $0 [options] <server-ip>

Options:
    -c, --config <path>   Use custom config file
    -f, --force           Skip all confirmations
    --skip-cleanup        Skip cleanup step
    --skip-ssl           Skip SSL renewal
    --backup-only        Only perform backup
    
Environment Variables:
    DOCKER_HUB_TOKEN     Docker Hub authentication token
    AUTO_CONFIRM         Skip confirmation prompts if set to 'true'

Examples:
    $0 -f 123.456.789.0
    $0 --skip-cleanup 123.456.789.0
EOF
}

# Validate input parameters
if [ -z "$SERVER_IP" ]; then
    log_error "Server IP address is required."
    show_help
    exit 1
fi

if [ -z "$DOCKER_HUB_TOKEN" ]; then
    log_error "DOCKER_HUB_TOKEN is not set. Please set it as an environment variable."
    echo "You can create a token at https://hub.docker.com/settings/security"
    exit 1
fi

# Initialize progress tracking
init_progress 4

# Print deployment information
log_info "Starting full deployment sequence for $(get_config API_DOMAIN) and $(get_config FRONTEND_DOMAIN)"
echo "Server IP: $SERVER_IP"
echo "Skip cleanup: ${SKIP_CLEANUP:-false}"
echo "Skip SSL: ${SKIP_SSL:-false}"
echo "Auto confirm: ${AUTO_CONFIRM:-false}"
echo

# Verify SSH connection
if ! verify_ssh_connection "$(get_config SERVER_USER)" "$SERVER_IP"; then
    exit 1
fi

# Setup error handling
trap 'handle_error $?' ERR

handle_error() {
    local exit_code=$1
    log_error "Deployment failed with exit code $exit_code"
    perform_backup
    exit $exit_code
}

# Perform backup if requested
if [ "$BACKUP_ONLY" = "true" ]; then
    perform_backup
    log_success "Backup completed successfully!"
    exit 0
fi

# Step 1: Cleanup
if [ "$SKIP_CLEANUP" != "true" ]; then
    progress "Cleaning up existing deployment"
    confirm_step "cleanup"
    
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
    scp remote_cleanup.sh "$(get_config SERVER_USER)@$SERVER_IP:/root/"
    ssh "$(get_config SERVER_USER)@$SERVER_IP" "chmod +x /root/remote_cleanup.sh && /root/remote_cleanup.sh"
    rm remote_cleanup.sh
    
    log_success "Server cleanup completed successfully!"
    log_info "SSL certificates have been backed up (if they existed)."
fi

# Step 2: Deploy with HTTPS
progress "Deploying with HTTPS configuration"
if [ "$SKIP_SSL" != "true" ]; then
    confirm_step "deployment"
    DOCKER_HUB_TOKEN="$DOCKER_HUB_TOKEN" ./scripts/deploy.sh "$SERVER_IP"
fi

# Step 3: Verify deployment
progress "Verifying deployment"
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
check_https_endpoint "$(get_config API_DOMAIN)" true
check_https_endpoint "$(get_config FRONTEND_DOMAIN)" false

# Step 4: Final verification
progress "Final verification"
log_success "Deployment completed successfully!"
log_info "API endpoint: https://$(get_config API_DOMAIN)"
log_info "Frontend endpoint: https://$(get_config FRONTEND_DOMAIN)"