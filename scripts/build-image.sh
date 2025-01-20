#!/bin/bash

set -e

# Configuration
DOCKER_HUB_USERNAME="mrdevx"
APP_NAME="nn-backend-api"
IMAGE_TAG="latest"

# Color codes for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building Docker image ${DOCKER_HUB_USERNAME}/${APP_NAME}:${IMAGE_TAG}...${NC}"
docker build -t ${DOCKER_HUB_USERNAME}/${APP_NAME}:${IMAGE_TAG} .

echo -e "${GREEN}Logging in to Docker Hub...${NC}"
if [ -z "$DOCKER_HUB_TOKEN" ]; then
    echo "Error: DOCKER_HUB_TOKEN environment variable is not set"
    exit 1
fi
echo "$DOCKER_HUB_TOKEN" | docker login -u ${DOCKER_HUB_USERNAME} --password-stdin

echo -e "${GREEN}Pushing image to Docker Hub...${NC}"
docker push ${DOCKER_HUB_USERNAME}/${APP_NAME}:${IMAGE_TAG}

echo -e "${GREEN}Logging out from Docker Hub...${NC}"
docker logout

echo -e "${GREEN}Successfully built and pushed image ${DOCKER_HUB_USERNAME}/${APP_NAME}:${IMAGE_TAG}${NC}" 