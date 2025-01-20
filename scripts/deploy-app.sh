#!/bin/bash

set -e

# Check if server IP is provided
if [ -z "$1" ]; then
    echo "Error: Server IP address is required"
    echo "Usage: $0 <server-ip>"
    exit 1
fi

# Configuration
SERVER_IP="$1"
SERVER_USER="root"
DOCKER_HUB_USERNAME="mrdevx"
APP_NAME="nn-backend-api"
IMAGE_TAG="latest"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying to server ${SERVER_IP}...${NC}"

# Login to Docker Hub on server
echo -e "${GREEN}Setting up Docker Hub authentication on server...${NC}"
if [ -z "$DOCKER_HUB_TOKEN" ]; then
    echo -e "${RED}Error: DOCKER_HUB_TOKEN environment variable is not set${NC}"
    exit 1
fi

# Copy configuration files
echo -e "${GREEN}Copying configuration files...${NC}"
scp docker-compose.yml nginx.conf $SERVER_USER@$SERVER_IP:/root/

# Deploy using SSH
echo -e "${GREEN}Deploying application...${NC}"
ssh $SERVER_USER@$SERVER_IP << EOF
    cd /root
    echo "$DOCKER_HUB_TOKEN" | docker login -u $DOCKER_HUB_USERNAME --password-stdin
    
    echo "Pulling latest image..."
    docker pull $DOCKER_HUB_USERNAME/$APP_NAME:$IMAGE_TAG
    
    echo "Stopping existing containers..."
    docker compose down --remove-orphans
    
    echo "Cleaning up any stale containers..."
    docker container prune -f
    
    echo "Starting services..."
    docker compose up -d
    
    echo "Logging out from Docker Hub..."
    docker logout

    # Start following logs in the background
    docker compose logs -f &
    LOGS_PID=\$!
    
    # Function to show container details
    show_container_details() {
        local container_name=\$1
        echo -e "\n${YELLOW}=============== Details for \${container_name} ===============${NC}"
        echo -e "${BLUE}Container Status:${NC}"
        docker compose ps \${container_name}
        echo -e "\n${BLUE}Container Health Check Configuration:${NC}"
        docker inspect \$(docker compose ps -q \${container_name}) | grep -A 10 "Health"
        echo -e "\n${BLUE}Process List:${NC}"
        docker compose exec -T \${container_name} ps aux || true
        echo -e "\n${BLUE}Network Connectivity Test:${NC}"
        if [ "\${container_name}" = "api" ]; then
            docker compose exec -T \${container_name} wget -qO- --timeout=5 http://localhost:3000/v1/health || echo "Failed to connect to API health check"
        else
            docker compose exec -T \${container_name} wget -qO- --timeout=5 http://localhost/nginx-health || echo "Failed to connect to Nginx health check"
        fi
        echo -e "\n${BLUE}Recent Logs:${NC}"
        docker compose logs --tail=50 \${container_name}
    }
    
    # Wait for services to be healthy
    echo -e "${GREEN}Waiting for services to be healthy...${NC}"
    TIMEOUT=300
    START_TIME=\$(date +%s)
    LAST_STATUS=""
    
    while true; do
        CURRENT_TIME=\$(date +%s)
        ELAPSED_TIME=\$((CURRENT_TIME - START_TIME))
        
        if [ \$ELAPSED_TIME -gt \$TIMEOUT ]; then
            echo -e "${RED}Timeout waiting for services to be healthy${NC}"
            echo -e "${YELLOW}Showing detailed diagnostics...${NC}"
            # Kill the logs follower
            kill \$LOGS_PID
            show_container_details "api"
            show_container_details "nginx"
            exit 1
        fi
        
        API_HEALTH=\$(docker compose ps api --format json | grep -o '"Health": "[^"]*"' | cut -d'"' -f4)
        NGINX_HEALTH=\$(docker compose ps nginx --format json | grep -o '"Health": "[^"]*"' | cut -d'"' -f4)
        
        CURRENT_STATUS="API: \$API_HEALTH, Nginx: \$NGINX_HEALTH"
        if [ "\$CURRENT_STATUS" != "\$LAST_STATUS" ]; then
            echo -e "\n${GREEN}Health status changed - \$CURRENT_STATUS${NC}"
            LAST_STATUS="\$CURRENT_STATUS"
            
            # If API is still starting after 30 seconds, show details
            if [ \$ELAPSED_TIME -gt 30 ] && [ "\$API_HEALTH" = "starting" ]; then
                echo -e "\n${YELLOW}API container is taking longer than expected to start. Showing details:${NC}"
                show_container_details "api"
            fi
        fi
        
        if [ "\$API_HEALTH" = "healthy" ] && [ "\$NGINX_HEALTH" = "healthy" ]; then
            echo -e "\n${GREEN}All services are healthy!${NC}"
            # Kill the logs follower
            kill \$LOGS_PID
            break
        fi
        
        sleep 10
    done
    
    # Verify deployment
    echo -e "\n${GREEN}Verifying deployment...${NC}"
    echo -e "${BLUE}Testing Nginx health check...${NC}"
    if curl -v http://localhost/nginx-health 2>&1; then
        echo -e "${GREEN}Nginx is responding correctly${NC}"
    else
        echo -e "${RED}Error: Nginx health check failed${NC}"
        show_container_details "nginx"
        exit 1
    fi
    
    echo -e "\n${BLUE}Testing API health check...${NC}"
    if curl -v http://localhost/v1/health 2>&1; then
        echo -e "${GREEN}API is responding correctly${NC}"
    else
        echo -e "${RED}Error: API health check failed${NC}"
        show_container_details "api"
        exit 1
    fi
    
    echo -e "\n${GREEN}All verification checks passed!${NC}"
EOF

echo -e "${GREEN}Deployment completed successfully!${NC}"