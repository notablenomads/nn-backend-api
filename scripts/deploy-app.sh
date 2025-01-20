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

echo -e "${GREEN}[INFO] Starting deployment to $SERVER_IP...${NC}"

# Copy docker-compose and env files
echo -e "${GREEN}[INFO] Copying configuration files...${NC}"
scp docker-compose.yml .env "$SERVER_USER@$SERVER_IP:/root/"

# Deploy the application
echo -e "${GREEN}[INFO] Deploying application...${NC}"
ssh "$SERVER_USER@$SERVER_IP" <<-'EOF'
cd /root

# Pull the latest image
echo "Pulling latest images..."
docker-compose pull

# Stop and remove the existing API container
echo "Stopping existing API container..."
docker-compose stop api
docker-compose rm -f api

# Start the API service
echo "Starting API service..."
docker-compose up -d api

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
    docker-compose logs api
    docker-compose stop api
    docker-compose rm -f api
    exit 1
fi

# Verify API is responding correctly
response=$(curl -s http://localhost:3000/v1/health)
if [ $? -eq 0 ]; then
    echo "API health check successful!"
    echo "Response: $response"
else
    echo "Error: API health check failed"
    docker-compose logs api
    exit 1
fi

echo "Deployment completed successfully!"
EOF