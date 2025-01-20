#!/bin/bash

# Exit on any error
set -e

# Check if server IP is provided
if [ -z "$1" ]; then
    echo -e "\033[0;31mError: Server IP address is required.\033[0m"
    echo "Usage: $0 <server-ip>"
    exit 1
fi

# Configuration
SERVER_IP="$1"
SERVER_USER="root"
DOCKER_HUB_USERNAME="mrdevx"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Deploying to server ${SERVER_IP}...\033[0m"

# Check for Docker Hub token
if [ -z "$DOCKER_HUB_TOKEN" ]; then
    echo -e "${RED}Error: DOCKER_HUB_TOKEN environment variable is not set${NC}"
    exit 1
fi

# Set up Docker Hub authentication on server
echo -e "${GREEN}Setting up Docker Hub authentication on server...\033[0m"
ssh $SERVER_USER@$SERVER_IP "echo $DOCKER_HUB_TOKEN | docker login -u $DOCKER_HUB_USERNAME --password-stdin"

# Copy configuration files
echo -e "${GREEN}Copying configuration files...\033[0m"
scp docker-compose.yml nginx.conf .env $SERVER_USER@$SERVER_IP:/root/

# Deploy and debug
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /root

echo "Stopping existing containers..."
docker compose down --remove-orphans

echo "Starting services..."
docker compose up -d

echo "Waiting for services to start..."
sleep 10

echo "Container Status:"
docker compose ps

echo "Container Logs:"
docker compose logs --tail=50

echo "Checking ports:"
netstat -tlpn | grep -E ':80|:443|:3000'

echo "Testing API directly:"
curl -v http://localhost:3000/v1/health

echo "Testing through Nginx:"
curl -v http://localhost/v1/health

echo "DNS Resolution:"
dig api.notablenomads.com +short

echo "Nginx Configuration Test:"
docker compose exec nginx nginx -t

echo "Nginx Configuration:"
docker compose exec nginx cat /etc/nginx/conf.d/default.conf
ENDSSH

# Log out from Docker Hub
echo -e "${GREEN}Logging out from Docker Hub...\033[0m"
ssh $SERVER_USER@$SERVER_IP "docker logout"

echo -e "${GREEN}Deployment complete. Check the output above for any issues.${NC}"