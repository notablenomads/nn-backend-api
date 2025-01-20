#!/bin/bash

# Exit on any error
set -e

# Check if server IP is provided
if [ -z "$1" ]; then
    echo "Error: Server IP is required"
    echo "Usage: $0 <server-ip> [--production]"
    exit 1
fi

# Configuration
SERVER_IP="$1"
PRODUCTION_FLAG="$2"
SERVER_USER="root"
APP_NAME="nn-backend-api"
DOMAIN="api.notablenomads.com"
DOCKER_HUB_USERNAME="mrdevx"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
log_info() {
    echo -e "\033[0;34m[INFO] $1\033[0m"
}

log_warn() {
    echo -e "\033[0;33m[WARN] $1\033[0m"
}

log_error() {
    echo -e "\033[0;31m[ERROR] $1\033[0m"
    exit 1
}

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

# Make scripts executable
chmod +x scripts/*.sh

# Function to run a step and check its result
run_step() {
    local step_name="$1"
    local command="$2"
    
    echo -e "\n${GREEN}=== Running step: $step_name ===${NC}"
    if ! $command; then
        echo -e "${RED}[ERROR] Step '$step_name' failed${NC}"
        exit 1
    fi
}

# Main deployment process
echo -e "${GREEN}Starting deployment process...${NC}"

# Step 1: Build and push Docker image
run_step "Build and push Docker image" "./scripts/build-image.sh"

# Step 2: Initial setup - create directories and copy base files
echo -e "\n${GREEN}=== Initial server setup ===${NC}"
ssh $SERVER_USER@$SERVER_IP "mkdir -p /root/certbot/conf /root/certbot/www"
scp docker-compose.yml .env "$SERVER_USER@$SERVER_IP:/root/"

# Step 3: Set up initial nginx for certbot
run_step "Set up SSL certificates" "./scripts/setup-ssl.sh $SERVER_IP $PRODUCTION_FLAG"

# Step 4: Deploy the application first (so nginx can proxy to it)
run_step "Deploy application" "./scripts/deploy-app.sh $SERVER_IP"

# Step 5: Set up final nginx configuration with SSL
run_step "Set up Nginx" "./scripts/setup-nginx.sh $SERVER_IP"

# Step 6: Verify deployment
echo -e "\n${GREEN}=== Verifying deployment ===${NC}"
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /root

# Check if services are running
echo "Checking service status..."
docker-compose ps

# Check SSL certificates
echo -e "\nChecking SSL certificates..."
if [ -d "/root/certbot/conf/live" ]; then
    echo "SSL certificates are present"
else
    echo "Warning: SSL certificates not found"
fi

# Test API health
echo -e "\nTesting API health..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/v1/health | grep -q "200"; then
    echo "API is healthy"
else
    echo "Warning: API health check failed"
fi
ENDSSH

echo -e "\n${GREEN}=== Deployment completed successfully! ===${NC}"
echo -e "\n📝 Next steps:"
echo "1. Verify your domain's DNS A record points to: $SERVER_IP"
echo "2. Test the API endpoint: curl https://api.notablenomads.com/v1/health"
echo "3. Monitor the logs with: ssh root@$SERVER_IP 'docker-compose logs -f'"
echo -e "\n${GREEN}To clean up everything, run: ./scripts/cleanup.sh $SERVER_IP${NC}" 