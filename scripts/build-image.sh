#!/bin/bash

set -e

# Configuration
DOCKER_HUB_USERNAME="mrdevx"
APP_NAME="nn-backend-api"
IMAGE_TAG="latest"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}[INFO] Building Docker image...${NC}"
docker build -t $DOCKER_HUB_USERNAME/$APP_NAME:$IMAGE_TAG .

echo -e "${GREEN}[INFO] Pushing image to Docker Hub...${NC}"
docker push $DOCKER_HUB_USERNAME/$APP_NAME:$IMAGE_TAG

echo -e "${GREEN}[INFO] Image build and push completed successfully!${NC}" 