#!/bin/bash

set -e

# Configuration
DOCKER_HUB_USERNAME="mrdevx"
APP_NAME="nn-backend-api"
IMAGE_TAG="latest"

# Check if docker command is available
if ! command -v docker &> /dev/null; then
    echo "Error: docker command not found. Please install Docker."
    exit 1
fi

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check for Docker Hub token
if [ -z "$DOCKER_HUB_TOKEN" ]; then
    echo -e "${RED}Error: DOCKER_HUB_TOKEN environment variable is not set${NC}"
    exit 1
fi

echo -e "${GREEN}Building Docker image ${DOCKER_HUB_USERNAME}/${APP_NAME}:${IMAGE_TAG}...${NC}"

# Build the image
docker build \
    --build-arg NODE_ENV=production \
    -t ${DOCKER_HUB_USERNAME}/${APP_NAME}:${IMAGE_TAG} .

# Login to Docker Hub
echo -e "${GREEN}Logging in to Docker Hub...${NC}"
echo "$DOCKER_HUB_TOKEN" | docker login -u ${DOCKER_HUB_USERNAME} --password-stdin

# Push the image
echo -e "${GREEN}Pushing image to Docker Hub...${NC}"
docker push ${DOCKER_HUB_USERNAME}/${APP_NAME}:${IMAGE_TAG}

# Logout for security
echo -e "${GREEN}Logging out from Docker Hub...${NC}"
docker logout

echo -e "${GREEN}Successfully built and pushed image ${DOCKER_HUB_USERNAME}/${APP_NAME}:${IMAGE_TAG}${NC}"