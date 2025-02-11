#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP="$1"
SERVER_USER="root"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Validate input
if [ -z "$SERVER_IP" ]; then
    log_error "Usage: $0 <server-ip>"
    exit 1
fi

# Generate deployment key pair
log_info "Generating new SSH key pair for deployment..."
KEY_NAME="github-actions-deploy"
ssh-keygen -t ed25519 -C "$KEY_NAME" -f "./$KEY_NAME" -N ""

# Display the keys
log_info "Here's your private key (add this to GitHub Secrets as DEPLOY_SSH_KEY):"
echo
cat "./$KEY_NAME"
echo
log_info "Here's your public key (will be added to the server):"
echo
cat "./$KEY_NAME.pub"
echo

# Setup keys on server
log_info "Setting up keys on server..."
ssh -o StrictHostKeyChecking=accept-new "$SERVER_USER@$SERVER_IP" "
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    echo '$(cat ./$KEY_NAME.pub)' >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    
    # Configure SSH server
    if ! grep -q 'PubkeyAuthentication yes' /etc/ssh/sshd_config; then
        echo 'PubkeyAuthentication yes' >> /etc/ssh/sshd_config
    fi
    if ! grep -q 'PermitRootLogin yes' /etc/ssh/sshd_config; then
        echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config
    fi
    
    # Restart SSH service
    systemctl restart sshd
"

# Cleanup local keys
log_info "Cleaning up local key files..."
rm "./$KEY_NAME" "./$KEY_NAME.pub"

log_success "SSH key setup completed successfully!"
log_info "IMPORTANT: Make sure to:"
log_info "1. Copy the private key shown above to GitHub Secrets as DEPLOY_SSH_KEY"
log_info "2. Test the connection using: ssh -i ~/.ssh/github-actions-deploy $SERVER_USER@$SERVER_IP" 