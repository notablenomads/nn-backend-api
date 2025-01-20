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

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}[WARNING] This will remove all containers, volumes, and configurations. Are you sure? (y/N)${NC}"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo -e "${GREEN}[INFO] Starting cleanup on $SERVER_IP...${NC}"

ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
cd /root

# Stop and remove all containers
echo "Stopping and removing containers..."
docker-compose down -v

# Remove all configuration files
echo "Removing configuration files..."
rm -f nginx.conf docker-compose.yml .env

# Remove SSL certificates and related files
echo "Removing SSL certificates..."
rm -rf certbot/

# Remove any leftover Docker images
echo "Removing Docker images..."
docker image prune -af

# Remove cron jobs
echo "Removing cron jobs..."
crontab -r

echo "Cleanup completed successfully!"
ENDSSH

echo -e "${GREEN}[INFO] Server cleanup completed!${NC}" 