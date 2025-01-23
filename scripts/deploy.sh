#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP=""
SERVER_USER="root"
APP_NAME="nn-backend-api"
DOMAIN="api.notablenomads.com"
DOCKER_HUB_USERNAME="mrdevx"

# Docker Hub configuration
# Create a token at https://hub.docker.com/settings/security
DOCKER_HUB_TOKEN="${DOCKER_HUB_TOKEN:-}"  # Set this as environment variable or pass it when running the script

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

# Check if required commands exist
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Required command '$1' is not installed."
        exit 1
    fi
}

# Check if SSH connection can be established
check_ssh_connection() {
    if ! ssh -o ConnectTimeout=10 "$1" "echo 'SSH connection successful'" &> /dev/null; then
        log_error "Could not establish SSH connection to $1"
        exit 1
    fi
}

# Docker Hub login function
docker_login() {
    local host="$1"
    if [ -z "$DOCKER_HUB_TOKEN" ]; then
        log_error "DOCKER_HUB_TOKEN is not set. Please set it as an environment variable or pass it when running the script."
        echo "You can create a token at https://hub.docker.com/settings/security"
        exit 1
    fi
    echo "$DOCKER_HUB_TOKEN" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin "$host"
}

# Validate input parameters
if [ -z "$1" ]; then
    log_error "Server IP address is required."
    echo "Usage: DOCKER_HUB_TOKEN=<token> $0 <server-ip> [--production]"
    exit 1
fi

SERVER_IP="$1"
USE_STAGING=true

# Check if --production flag is provided
if [ "$2" = "--production" ]; then
    USE_STAGING=false
    log_info "Using production environment for SSL certificates"
else
    log_info "Using staging environment for SSL certificates"
fi

# Step 1: Verify DNS configuration
log_info "Step 1: Verifying DNS configuration"
log_info "Verifying DNS configuration for $DOMAIN..."

# Check DNS A record
log_info "Checking DNS A record..."
CURRENT_IP=$(dig +short $DOMAIN)

if [ -z "$CURRENT_IP" ]; then
    log_error "No DNS A record found for $DOMAIN"
    exit 1
fi

# Check if the IP is a Cloudflare IP
if echo "$CURRENT_IP" | grep -qE '^188\.114\.(96|97)\.[0-9]+$'; then
    log_info "Detected Cloudflare proxy, proceeding with deployment"
else
    if [ "$CURRENT_IP" != "$SERVER_IP" ]; then
        log_error "DNS A record points to $CURRENT_IP, but server IP is $SERVER_IP"
        exit 1
    fi
fi

log_success "DNS configuration is correct!"

# Check required commands
check_command "docker"
check_command "ssh"
check_command "scp"

# Step 2: Build and push Docker image
log_info "Step 2: Building and pushing Docker image"

# Login to Docker Hub locally
log_info "Logging in to Docker Hub locally..."
docker_login ""

log_info "Building and pushing Docker image..."
docker build -t "$DOCKER_HUB_USERNAME/$APP_NAME:latest" .
docker push "$DOCKER_HUB_USERNAME/$APP_NAME:latest"

log_info "Logging out from Docker Hub locally..."
docker logout

log_success "Successfully built and pushed image $DOCKER_HUB_USERNAME/$APP_NAME:latest"

# Step 3: Set up server
log_info "Step 3: Setting up server"
check_ssh_connection "$SERVER_USER@$SERVER_IP"

# Create required directories
log_info "Creating required directories..."
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p /root/certbot/conf /root/certbot/logs /root/ssl_backup"

# Login to Docker Hub on remote server
log_info "Setting up Docker Hub authentication on remote server..."
ssh "$SERVER_USER@$SERVER_IP" "echo '$DOCKER_HUB_TOKEN' | docker login -u '$DOCKER_HUB_USERNAME' --password-stdin"

# Copy configuration files
log_info "Copying configuration files..."
scp docker-compose.yml nginx.conf .env "$SERVER_USER@$SERVER_IP:/root/"

# Step 4: Set up SSL and deploy application
log_info "Step 4: Setting up SSL and deploying application"

# Copy SSL management script
log_info "Copying SSL management script..."
scp scripts/ssl-cert.sh "$SERVER_USER@$SERVER_IP:/root/"

# Execute deployment on remote server
ssh "$SERVER_USER@$SERVER_IP" << 'DEPLOY'
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions for remote execution
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

cd /root

# Stop all services
log_info "Stopping all services..."
docker-compose down
docker rm -f $(docker ps -aq) 2>/dev/null || true

# Install certbot standalone on the host
log_info "Installing certbot..."
apt-get update
apt-get install -y certbot

# Make SSL script executable
chmod +x ssl-cert.sh

# Handle SSL certificates
log_info "Handling SSL certificates..."
if [ -d "/etc/letsencrypt/live/api.notablenomads.com" ]; then
    log_info "Found existing certificates..."
    ./ssl-cert.sh --force-renew
else
    log_info "No existing certificates found, generating new ones..."
    if [ "${USE_STAGING}" = "true" ]; then
        ./ssl-cert.sh --new --staging
    else
        ./ssl-cert.sh --new
    fi
fi

# Start services
log_info "Starting services..."
docker-compose up -d api

# Wait for API to be healthy
log_info "Waiting for API to be healthy..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker-compose ps api | grep -q "(healthy)"; then
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -eq 0 ]; then
    log_error "API failed to become healthy"
    docker-compose logs api
    exit 1
fi

# Start nginx
log_info "Starting nginx..."
docker-compose up -d nginx

# Verify deployment
log_info "Verifying deployment..."
sleep 5
if ! curl -sk https://localhost/v1/health > /dev/null; then
    log_error "Health check failed. Checking logs..."
    docker-compose logs
    exit 1
fi

log_success "Deployment verified successfully!"
DEPLOY

log_success "Deployment completed successfully!"
echo -e "\n🌍 Your application should now be running at https://$DOMAIN"
echo -e "\n📝 Next steps:"
echo "1. Verify your domain's DNS A record points to: $SERVER_IP"
echo "2. Test the API endpoint: curl -k https://$DOMAIN/v1/health"
echo "3. Monitor the logs with: ssh $SERVER_USER@$SERVER_IP 'docker-compose logs -f'"

if [ "$USE_STAGING" = true ]; then
    echo -e "\n${YELLOW}Note: SSL certificates are in staging mode. Run with --production for valid certificates.${NC}"
fi