#!/bin/bash
set -e

# Configuration
DOMAIN="api.notablenomads.com"

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
NC='\033[0m'

echo -e "${GREEN}Verifying DNS configuration for ${DOMAIN}...${NC}"

# Get current IP from DNS
echo -e "\n${YELLOW}Checking DNS A record...${NC}"
CURRENT_IP=$(dig +short ${DOMAIN} A)

if [ -z "$CURRENT_IP" ]; then
    echo -e "${RED}Error: No A record found for ${DOMAIN}${NC}"
    echo "Please configure your DNS to point ${DOMAIN} to ${SERVER_IP}"
    exit 1
fi

echo "Current IP from DNS: ${CURRENT_IP}"
echo "Expected IP: ${SERVER_IP}"

if [ "$CURRENT_IP" != "$SERVER_IP" ]; then
    echo -e "${RED}Error: DNS is not pointing to the correct IP${NC}"
    echo "Please update your DNS configuration to point ${DOMAIN} to ${SERVER_IP}"
    exit 1
fi

echo -e "${GREEN}DNS configuration is correct!${NC}"

# Check DNS propagation
echo -e "\n${YELLOW}Checking DNS propagation...${NC}"
PROPAGATION_WARNINGS=0

if ! dig +short ${DOMAIN} @8.8.8.8 | grep -q "^${SERVER_IP}$"; then
    echo -e "${YELLOW}Warning: DNS changes may not have propagated to Google DNS (8.8.8.8) yet${NC}"
    PROPAGATION_WARNINGS=$((PROPAGATION_WARNINGS + 1))
fi

if ! dig +short ${DOMAIN} @1.1.1.1 | grep -q "^${SERVER_IP}$"; then
    echo -e "${YELLOW}Warning: DNS changes may not have propagated to Cloudflare DNS (1.1.1.1) yet${NC}"
    PROPAGATION_WARNINGS=$((PROPAGATION_WARNINGS + 1))
fi

# Optional connectivity checks
echo -e "\n${YELLOW}Running optional connectivity checks...${NC}"

echo "Checking HTTP (port 80) accessibility..."
if nc -zv $DOMAIN 80 2>/dev/null; then
    echo -e "${GREEN}Port 80 is accessible${NC}"
else
    echo -e "${YELLOW}Warning: Port 80 is not accessible yet (this is normal if Nginx isn't running)${NC}"
fi

echo -e "\n${GREEN}DNS verification completed successfully!${NC}"
if [ $PROPAGATION_WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Note: Some DNS servers haven't updated yet. This is normal and may take up to 48 hours.${NC}"
    echo -e "${YELLOW}You can proceed with deployment, but SSL certificate generation might fail until DNS propagates.${NC}"
fi 