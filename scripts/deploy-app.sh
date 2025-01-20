#!/bin/bash

set -e

# Check if server IP is provided
if [ -z "$1" ]; then
    echo "Error: Server IP is required"
    echo "Usage: $0 <server-ip>"
    exit 1
fi

# Configuration
SERVER_IP="$1"
SERVER_USER="root"
DOCKER_HUB_USERNAME="mrdevx"
APP_NAME="nn-backend-api"
IMAGE_TAG="latest"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check if DOCKER_HUB_TOKEN is set
if [ -z "$DOCKER_HUB_TOKEN" ]; then
    echo -e "${RED}[ERROR] DOCKER_HUB_TOKEN environment variable is not set${NC}"
    exit 1
fi

echo -e "${GREEN}[INFO] Starting deployment to $SERVER_IP...${NC}"

# First, ensure Docker is installed and running
echo -e "${GREEN}[INFO] Checking Docker installation...${NC}"
ssh "$SERVER_USER@$SERVER_IP" <<'DOCKERSETUP'
# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    
    # Update package list and install dependencies
    apt update
    apt install -y ca-certificates curl gnupg

    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add the repository to Apt sources
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker packages
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Start and enable Docker service
    systemctl start docker
    systemctl enable docker

    echo "Docker installed successfully!"
else
    echo "Docker is already installed."
fi

# Verify Docker is running
if ! systemctl is-active --quiet docker; then
    echo "Starting Docker service..."
    systemctl start docker
fi

# Test Docker installation
docker --version
docker compose version
DOCKERSETUP

# Copy configuration files
echo -e "${GREEN}[INFO] Copying configuration files...${NC}"
scp docker-compose.yml nginx.conf .env "$SERVER_USER@$SERVER_IP:/root/"

# Deploy the application
echo -e "${GREEN}[INFO] Deploying application...${NC}"
ssh "$SERVER_USER@$SERVER_IP" "DOCKER_HUB_TOKEN='$DOCKER_HUB_TOKEN' DOCKER_HUB_USERNAME='$DOCKER_HUB_USERNAME' APP_NAME='$APP_NAME' IMAGE_TAG='$IMAGE_TAG' bash -s" <<'EOF'
cd /root

# Remove any existing Docker config
rm -rf /root/.docker

# Create a minimal Docker config that disables credential storing
mkdir -p /root/.docker
cat > /root/.docker/config.json <<'DOCKERCONFIG'
{
  "credsStore": "",
  "credHelpers": {},
  "auths": {},
  "experimental": "disabled"
}
DOCKERCONFIG

# Login to Docker Hub using token
echo -e "[INFO] Logging in to Docker Hub..."
docker logout
docker login -u "$DOCKER_HUB_USERNAME" -p "$DOCKER_HUB_TOKEN" || {
    echo "Failed to login to Docker Hub"
    exit 1
}

# Pull the Docker image explicitly
echo "Pulling Docker image from Docker Hub..."
if ! docker pull "$DOCKER_HUB_USERNAME/$APP_NAME:$IMAGE_TAG"; then
    echo "Failed to pull Docker image"
    docker logout
    exit 1
fi

# Stop existing containers
echo "Stopping existing containers..."
docker compose down

# Start the services
echo "Starting services..."
docker compose up -d

# Wait for API to be healthy
echo "Waiting for API to be healthy..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:3000/v1/health > /dev/null; then
        echo "API service is healthy!"
        break
    fi
    echo "Waiting for API service... ($timeout seconds remaining)"
    sleep 5
    timeout=$((timeout-5))
done

if [ $timeout -le 0 ]; then
    echo "Error: API service failed to start. Showing logs:"
    docker compose logs api
    docker compose down
    exit 1
fi

# Verify API is responding correctly
response=$(curl -s http://localhost:3000/v1/health)
if [ $? -eq 0 ]; then
    echo "API health check successful!"
    echo "Response: $response"
else
    echo "Error: API health check failed"
    docker compose logs api
    exit 1
fi

# Verify Nginx is running
echo "Verifying Nginx configuration..."
if ! docker compose exec nginx nginx -t; then
    echo "Error: Nginx configuration test failed"
    docker compose logs nginx
    exit 1
fi

# Test Nginx health endpoint
echo "Testing Nginx health endpoint..."
if curl -s http://localhost/nginx-health > /dev/null; then
    echo "Nginx health check successful!"
else
    echo "Error: Nginx health check failed"
    docker compose logs nginx
    exit 1
fi

# Cleanup Docker login
docker logout

echo "Deployment completed successfully!"
EOF