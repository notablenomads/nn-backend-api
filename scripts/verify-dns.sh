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
if ! dig +short ${DOMAIN} @8.8.8.8 | grep -q "^${SERVER_IP}$"; then
    echo -e "${YELLOW}Warning: DNS changes may not have propagated to Google DNS (8.8.8.8) yet${NC}"
    echo "This might take some time. You can proceed, but SSL certificate generation might fail."
fi

if ! dig +short ${DOMAIN} @1.1.1.1 | grep -q "^${SERVER_IP}$"; then
    echo -e "${YELLOW}Warning: DNS changes may not have propagated to Cloudflare DNS (1.1.1.1) yet${NC}"
    echo "This might take some time. You can proceed, but SSL certificate generation might fail."
fi

echo -e "\n${GREEN}DNS verification completed!${NC}"

# Check if port 80 is accessible
echo -e "\nChecking HTTP (port 80) accessibility..."
nc -zv $DOMAIN 80 2>&1 || echo "Port 80 is not accessible"

# Test the ACME challenge path directly
echo -e "\nTesting ACME challenge path..."
curl -v http://$DOMAIN/.well-known/acme-challenge/test 2>&1 | grep "404" 