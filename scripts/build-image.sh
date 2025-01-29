#!/bin/bash

set -e

# Configuration
DOCKER_HUB_USERNAME="mrdevx"
APP_NAME="nn-backend-api"
VERSION=$(node -p "require('../package.json').version")
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

echo -e "${GREEN}Building Docker image ${DOCKER_HUB_USERNAME}/${APP_NAME}:${VERSION}...${NC}"

# Build the image with both version and latest tags
docker build \
    --build-arg NODE_ENV=production \
    -t ${DOCKER_HUB_USERNAME}/${APP_NAME}:${VERSION} \
    -t ${DOCKER_HUB_USERNAME}/${APP_NAME}:${IMAGE_TAG} .

# Login to Docker Hub
echo -e "${GREEN}Logging in to Docker Hub...${NC}"
echo "$DOCKER_HUB_TOKEN" | docker login -u ${DOCKER_HUB_USERNAME} --password-stdin

# Push both tags
echo -e "${GREEN}Pushing version tag to Docker Hub...${NC}"
docker push ${DOCKER_HUB_USERNAME}/${APP_NAME}:${VERSION}

echo -e "${GREEN}Pushing latest tag to Docker Hub...${NC}"
docker push ${DOCKER_HUB_USERNAME}/${APP_NAME}:${IMAGE_TAG}

# Logout for security
echo -e "${GREEN}Logging out from Docker Hub...${NC}"
docker logout

echo -e "${GREEN}Successfully built and pushed images:${NC}"
echo -e "  - ${DOCKER_HUB_USERNAME}/${APP_NAME}:${VERSION}"
echo -e "  - ${DOCKER_HUB_USERNAME}/${APP_NAME}:${IMAGE_TAG}"