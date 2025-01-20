#!/bin/bash

DOMAIN="api.notablenomads.com"
SERVER_IP="$1"

if [ -z "$SERVER_IP" ]; then
    echo "Error: Server IP is required"
    echo "Usage: $0 <server-ip>"
    exit 1
fi

echo "Checking DNS configuration for $DOMAIN..."
echo "Expected IP: $SERVER_IP"

# Get the current IP from DNS
CURRENT_IP=$(dig +short $DOMAIN)

echo "Current IP from DNS: $CURRENT_IP"

if [ "$CURRENT_IP" = "$SERVER_IP" ]; then
    echo "✅ DNS is correctly configured"
else
    echo "❌ DNS is not correctly configured"
    echo "Please update your DNS settings to point $DOMAIN to $SERVER_IP"
    echo "Note: DNS changes may take up to 48 hours to propagate"
fi

# Check if port 80 is accessible
echo -e "\nChecking HTTP (port 80) accessibility..."
nc -zv $DOMAIN 80 2>&1 || echo "Port 80 is not accessible"

# Test the ACME challenge path directly
echo -e "\nTesting ACME challenge path..."
curl -v http://$DOMAIN/.well-known/acme-challenge/test 2>&1 | grep "404" 