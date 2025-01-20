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

# Check if scp command is available
if ! command -v scp &> /dev/null; then
    echo "Error: scp command not found. Please install OpenSSH."
    exit 1
fi

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

    # Function to show container details
    show_container_details() {
        local container_name=\$1
        echo -e "\n${YELLOW}=============== Details for \${container_name} ===============${NC}"
        echo -e "${BLUE}Container Status:${NC}"
        docker compose ps \${container_name}
        
        echo -e "\n${BLUE}Container Health Check Configuration:${NC}"
        docker inspect \$(docker compose ps -q \${container_name}) | grep -A 10 "Health"
        
        echo -e "\n${BLUE}Container Logs:${NC}"
        docker compose logs --tail=100 \${container_name}
        
        if [ "\${container_name}" = "nginx" ]; then
            echo -e "\n${BLUE}Nginx Configuration Test:${NC}"
            docker compose exec -T \${container_name} nginx -t || echo "Nginx config test failed"
            
            echo -e "\n${BLUE}Nginx Configuration:${NC}"
            docker compose exec -T \${container_name} cat /etc/nginx/conf.d/default.conf
            
            echo -e "\n${BLUE}Testing Nginx Health Check Internally:${NC}"
            docker compose exec -T \${container_name} wget -qO- http://localhost/nginx-health || echo "Failed to connect to Nginx health check"
            
            echo -e "\n${BLUE}Nginx Process:${NC}"
            docker compose exec -T \${container_name} ps aux | grep nginx || echo "No Nginx process found"
            
            echo -e "\n${BLUE}Network Info:${NC}"
            docker compose exec -T \${container_name} netstat -tlpn || echo "netstat not available"
        fi
        
        if [ "\${container_name}" = "api" ]; then
            echo "Testing API health endpoint internally..."
            docker compose exec -T \${container_name} wget -qO- --spider --timeout=5 http://localhost:3000/v1/health || echo "Failed to connect to API health check"
            echo "Testing API health endpoint through curl..."
            docker compose exec -T \${container_name} curl -v http://localhost:3000/v1/health || echo "Failed to connect to API health check with curl"
            
            echo -e "\n${BLUE}Listening Ports:${NC}"
            docker compose exec -T \${container_name} netstat -tlpn || echo "netstat not available"
            
            echo -e "\n${BLUE}Environment Variables:${NC}"
            docker compose exec -T \${container_name} env | sort
            
            echo -e "\n${BLUE}Node.js Process:${NC}"
            docker compose exec -T \${container_name} ps aux | grep node || echo "No Node.js process found"
        fi
        
        echo -e "\n${BLUE}Container Network Info:${NC}"
        docker inspect \$(docker compose ps -q \${container_name}) | grep -A 20 "NetworkSettings"
    }
    
    # Wait for services to be healthy
    echo -e "${GREEN}Waiting for services to be healthy...${NC}"
    TIMEOUT=120
    START_TIME=\$(date +%s)
    LAST_STATUS=""
    
    while true; do
        CURRENT_TIME=\$(date +%s)
        ELAPSED_TIME=\$((CURRENT_TIME - START_TIME))
        
        if [ \$ELAPSED_TIME -gt \$TIMEOUT ]; then
            echo -e "${RED}Timeout waiting for services to be healthy${NC}"
            echo -e "${YELLOW}Showing detailed diagnostics...${NC}"
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
            
            # If API is unhealthy or still starting after 30 seconds, show details
            if [ \$ELAPSED_TIME -gt 30 ] && [ "\$API_HEALTH" != "healthy" ]; then
                echo -e "\n${YELLOW}API container is taking longer than expected. Showing details:${NC}"
                show_container_details "api"
            fi
        fi
        
        if [ "\$API_HEALTH" = "healthy" ] && [ "\$NGINX_HEALTH" = "healthy" ]; then
            echo -e "\n${GREEN}All services are healthy!${NC}"
            break
        fi
        
        sleep 10
    done
    
    # Final verification
    echo -e "\n${GREEN}Verifying deployment...${NC}"
    echo -e "${BLUE}Testing API health check directly...${NC}"
    if curl -v http://localhost:3000/v1/health 2>&1; then
        echo -e "${GREEN}API is responding correctly${NC}"
    else
        echo -e "${RED}Error: API health check failed${NC}"
        show_container_details "api"
        exit 1
    fi
    
    echo -e "\n${BLUE}Testing through Nginx...${NC}"
    if curl -v http://localhost/v1/health 2>&1; then
        echo -e "${GREEN}Nginx proxy to API is working correctly${NC}"
    else
        echo -e "${RED}Error: Nginx proxy to API failed${NC}"
        show_container_details "nginx"
        exit 1
    fi
EOF

echo -e "${GREEN}Deployment completed successfully!${NC}"