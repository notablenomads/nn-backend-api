#!/bin/bash

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default local port
LOCAL_PORT=5433

# Function to show usage
usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  $0 -s SERVER_IP [-p LOCAL_PORT]"
    echo
    echo "Options:"
    echo "  -s SERVER_IP    : Production server IP address"
    echo "  -p LOCAL_PORT   : Local port to forward to (default: 5433)"
    echo
    echo "Example:"
    echo "  $0 -s 123.456.789.0 -p 5433"
    echo
    echo -e "${BLUE}Note:${NC} After running this script:"
    echo "1. The tunnel will be established from your local port to the production database"
    echo "2. Use these settings in pgAdmin:"
    echo "   - Host: localhost"
    echo "   - Port: $LOCAL_PORT (or your specified port)"
    echo "   - Database: Your database name"
    echo "   - Username: Your database username"
    echo "   - Password: Your database password"
}

# Parse command line arguments
while getopts "s:p:h" opt; do
    case $opt in
        s)
            SERVER_IP="$OPTARG"
            ;;
        p)
            LOCAL_PORT="$OPTARG"
            ;;
        h)
            usage
            exit 0
            ;;
        \?)
            echo -e "${RED}Invalid option: -$OPTARG${NC}" >&2
            usage
            exit 1
            ;;
    esac
done

# Check if server IP is provided
if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}Error: Server IP is required${NC}"
    usage
    exit 1
fi

# Function to check if port is in use
is_port_in_use() {
    lsof -i ":$1" >/dev/null 2>&1
    return $?
}

# Check if the local port is already in use
if is_port_in_use "$LOCAL_PORT"; then
    echo -e "${RED}Error: Port $LOCAL_PORT is already in use${NC}"
    exit 1
fi

echo -e "${GREEN}Setting up SSH tunnel to production database...${NC}"
echo -e "Local port: ${BLUE}$LOCAL_PORT${NC}"
echo -e "Server: ${BLUE}$SERVER_IP${NC}"
echo
echo -e "${BLUE}Connection details for pgAdmin:${NC}"
echo "Host: localhost"
echo "Port: $LOCAL_PORT"
echo "Database: Your database name"
echo "Username: Your database username"
echo "Password: Your database password"
echo
echo -e "${GREEN}Starting tunnel...${NC}"
echo "Press Ctrl+C to stop the tunnel"
echo

# Create SSH tunnel
ssh -N -L "$LOCAL_PORT":localhost:5432 "root@$SERVER_IP"
