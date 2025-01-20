#!/bin/bash
set -e

# Check if server IP is provided
if [ -z "$1" ]; then
    echo "Error: Server IP address is required"
    echo "Usage: $0 <server-ip>"
    exit 1
fi

SERVER_IP="$1"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Make scripts executable
chmod +x scripts/build-image.sh
chmod +x scripts/verify-dns.sh
chmod +x scripts/setup-ssl.sh

# Step 1: Build and push Docker image
echo -e "\n${BLUE}Step 1: Building and pushing Docker image${NC}"
if ! ./scripts/build-image.sh; then
    echo -e "${RED}Failed to build and push Docker image${NC}"
    exit 1
fi

# Step 2: Verify DNS configuration
echo -e "\n${BLUE}Step 2: Verifying DNS configuration${NC}"
if ! ./scripts/verify-dns.sh "$SERVER_IP"; then
    echo -e "${RED}DNS verification failed${NC}"
    exit 1
fi

# Step 3: Deploy application
echo -e "\n${BLUE}Step 3: Deploying application${NC}"
if ! ./scripts/deploy-app.sh "$SERVER_IP"; then
    echo -e "${RED}Application deployment failed${NC}"
    exit 1
fi

# Step 4: Set up SSL (staging)
echo -e "\n${BLUE}Step 4: Setting up SSL certificates (staging)${NC}"
if ! ./scripts/setup-ssl.sh "$SERVER_IP"; then
    echo -e "${RED}SSL setup failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Note: SSL certificates are in staging mode. Run setup-ssl.sh with --production for valid certificates.${NC}"
echo -e "\nNext steps:"
echo "1. Test the application at http://api.notablenomads.com"
echo "2. Once everything is working, run: ./scripts/setup-ssl.sh $SERVER_IP --production" 