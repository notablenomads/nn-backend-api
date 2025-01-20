#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP="91.107.249.14"
SERVER_USER="root"
KEY_NAME="github-deploy"
KEY_PATH="$HOME/.ssh/${KEY_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Check if ssh-keygen exists
if ! command -v ssh-keygen &> /dev/null; then
    log_error "ssh-keygen is not installed. Please install OpenSSH."
    exit 1
fi

# Create .ssh directory if it doesn't exist
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

# Generate SSH key
log_info "Generating SSH key..."
ssh-keygen -t ed25519 -C "github-actions@notablenomads.com" -f "$KEY_PATH" -N "" -q

# Get the public key
PUBLIC_KEY=$(cat "${KEY_PATH}.pub")

# Get known hosts
log_info "Getting known hosts entry..."
KNOWN_HOSTS=$(ssh-keyscan -H "$SERVER_IP" 2>/dev/null)

if [ -z "$KNOWN_HOSTS" ]; then
    log_error "Failed to get known hosts entry"
    exit 1
fi

# Copy public key to server
log_info "Copying public key to server..."
if ! ssh -o StrictHostKeyChecking=accept-new "$SERVER_USER@$SERVER_IP" "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"; then
    log_error "Failed to copy public key to server"
    exit 1
fi

# Test connection
log_info "Testing SSH connection..."
if ! ssh -i "$KEY_PATH" -o StrictHostKeyChecking=accept-new "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'"; then
    log_error "Failed to connect with new key"
    exit 1
fi

# Output instructions
log_success "SSH key setup completed successfully!"
echo -e "\n📝 Next steps:"
echo "1. Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):"
echo -e "\n   SSH_PRIVATE_KEY:"
echo "   ---------------"
echo -e "$(cat "$KEY_PATH" | sed 's/^/   /')"
echo -e "\n   SSH_KNOWN_HOSTS:"
echo "   ---------------"
echo -e "$(echo "$KNOWN_HOSTS" | sed 's/^/   /')"

echo -e "\n2. The public key has been added to the server's authorized_keys file."
echo "3. You can now use the GitHub Actions workflow to deploy your application."

# Cleanup
log_info "Cleaning up local files..."
rm -f "$KEY_PATH" "${KEY_PATH}.pub"

log_success "Setup complete! You can now use GitHub Actions for deployment." 