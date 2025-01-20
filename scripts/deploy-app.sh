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

echo -e "\033[0;34mDeploying to server ${SERVER_IP}...\033[0m"

# Check for Docker Hub token
if [ -z "$DOCKER_HUB_TOKEN" ]; then
    echo -e "\033[0;31mError: DOCKER_HUB_TOKEN environment variable is required\033[0m"
    exit 1
fi

# Set up Docker Hub authentication on server
echo -e "\033[0;34mSetting up Docker Hub authentication on server...\033[0m"
ssh $SERVER_USER@$SERVER_IP "echo $DOCKER_HUB_TOKEN | docker login -u $DOCKER_HUB_USERNAME --password-stdin"

# Copy configuration files
echo -e "\033[0;34mCopying configuration files...\033[0m"
scp docker-compose.yml nginx.conf .env $SERVER_USER@$SERVER_IP:/root/

# Deploy application
echo -e "\033[0;34mDeploying application...\033[0m"
ssh $SERVER_USER@$SERVER_IP << EOF
    cd /root
    # Stop existing containers
    docker compose down
    # Clean up any stale containers
    docker container prune -f
    # Start API first
    docker compose up -d api
    # Wait for API to start
    echo "Waiting for API to start..."
    sleep 10
    # Start Nginx
    docker compose up -d nginx
    # Show container status
    docker compose ps
    # Show logs
    docker compose logs
EOF

# Log out from Docker Hub
echo -e "\033[0;34mLogging out from Docker Hub...\033[0m"
ssh $SERVER_USER@$SERVER_IP "docker logout"

echo -e "\033[0;32mDeployment completed!\033[0m"
echo -e "\nYour application should now be running at http://$SERVER_IP"
echo -e "You can check the logs with: ssh $SERVER_USER@$SERVER_IP 'docker compose logs -f'"