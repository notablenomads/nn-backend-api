#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP=""
SERVER_USER="root"
APP_NAME="nn-backend-api"
DOMAIN="api.platform.notablenomads.com"
DOCKER_HUB_USERNAME="mrdevx"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
log_info() { echo -e "${GREEN}ℹ️ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Validation checks
if [ -z "$DOCKER_HUB_TOKEN" ]; then
    log_error "DOCKER_HUB_TOKEN environment variable is not set"
    echo "Please set it first:"
    echo "export DOCKER_HUB_TOKEN=your_token_here"
    echo "You can generate a token at https://hub.docker.com/settings/security"
    exit 1
fi

if [ -z "$1" ]; then
    log_error "Please provide the server IP address as an argument"
    echo "Usage: ./deploy.sh <server-ip>"
    exit 1
else
    SERVER_IP=$1
fi

DOCKER_IMAGE_NAME="$DOCKER_HUB_USERNAME/$APP_NAME"

log_info "Starting deployment to Hetzner server at $SERVER_IP..."

# Local preparations
log_info "Logging in to Docker Hub..."
echo "$DOCKER_HUB_TOKEN" | docker login -u $DOCKER_HUB_USERNAME --password-stdin || {
    log_error "Failed to login to Docker Hub"
    exit 1
}

log_info "Building Docker image..."
docker build -t $DOCKER_IMAGE_NAME:latest . || {
    log_error "Failed to build Docker image"
    exit 1
}

log_info "Pushing image to Docker Hub..."
docker push $DOCKER_IMAGE_NAME:latest || {
    log_error "Failed to push Docker image"
    exit 1
}

# Create Docker config file
log_info "Creating Docker config..."
DOCKER_CONFIG_CONTENT="{\"auths\": {\"https://index.docker.io/v1/\": {\"auth\": \"$(echo -n "$DOCKER_HUB_USERNAME:$DOCKER_HUB_TOKEN" | base64)\"}}}"

# Copy configuration files to server
log_info "Copying configuration files to server..."
ssh -o ConnectTimeout=60 $SERVER_USER@$SERVER_IP 'mkdir -p /root/.docker /root/secrets'
echo "$DOCKER_CONFIG_CONTENT" | ssh -o ConnectTimeout=60 $SERVER_USER@$SERVER_IP 'cat > /root/.docker/config.json'
ssh -o ConnectTimeout=60 $SERVER_USER@$SERVER_IP 'chmod 600 /root/.docker/config.json'

scp -o ConnectTimeout=60 docker-compose.yml nginx.conf .env $SERVER_USER@$SERVER_IP:/root/ || {
    log_error "Failed to copy configuration files to server"
    exit 1
}

# Server setup and deployment
log_info "Setting up server configuration..."
ssh -o ConnectTimeout=60 $SERVER_USER@$SERVER_IP << ENDSSH
    set -e  # Exit on any error

    # Helper functions for remote execution
    log_info() { echo -e "\033[0;32mℹ️ \$1\033[0m"; }
    log_warn() { echo -e "\033[1;33m⚠️ \$1\033[0m"; }
    log_error() { echo -e "\033[0;31m❌ \$1\033[0m"; }

    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        log_info "Installing Docker..."
        apt-get update
        apt-get install -y ca-certificates curl gnupg
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg

        echo "deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(. /etc/os-release && echo "\$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        systemctl start docker
        systemctl enable docker
        usermod -aG docker \$USER
    fi

    # Ensure Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_info "Setting up Docker Compose..."
        ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
    fi

    # Stop and remove existing containers
    log_info "Cleaning up existing containers..."
    docker-compose down --remove-orphans || true
    docker system prune -f || true

    # Move .env to secrets directory
    log_info "Setting up environment variables..."
    mv -f /root/.env /root/secrets/.env 2>/dev/null || true

    # Verify Docker login
    log_info "Verifying Docker Hub access..."
    if ! docker pull hello-world; then
        log_error "Failed to verify Docker Hub access"
        exit 1
    fi

    # Pre-pull required images
    log_info "Pulling Docker images..."
    docker pull ${DOCKER_IMAGE_NAME}:latest || {
        log_error "Failed to pull API image"
        exit 1
    }
    docker pull nginx:stable-alpine || {
        log_error "Failed to pull nginx image"
        exit 1
    }

    # Start services
    log_info "Starting services..."
    docker-compose up -d

    # Verify services are running
    log_info "Verifying services..."
    sleep 10  # Give services time to start
    if ! docker-compose ps | grep -q "Up"; then
        log_error "Services failed to start properly"
        docker-compose logs
        exit 1
    fi

    log_info "Server setup completed successfully!"
ENDSSH

log_info "Deployment completed successfully!"
echo -e "
🌍 Your application should now be running at http://$DOMAIN

📝 Next steps:
1. Verify your domain's DNS A record points to: $SERVER_IP
2. Test the API endpoint: curl http://$DOMAIN/v1/health
3. Monitor the logs with: ssh $SERVER_USER@$SERVER_IP 'docker-compose logs -f'
4. Once the application is running properly, you can set up SSL using a separate script
" 