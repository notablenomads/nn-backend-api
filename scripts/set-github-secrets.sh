#!/bin/bash

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI is not installed. Please install it first:"
    echo "brew install gh"
    exit 1
fi

# Check if logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "Please login to GitHub CLI first:"
    echo "gh auth login"
    exit 1
fi

# Get repository name from git config
REPO=$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\).git/\1/')

if [ -z "$REPO" ]; then
    echo "Could not determine repository name"
    exit 1
fi

echo "Setting secrets for repository: $REPO"

# Set ENV_CONTENT secret
if [ -f .env ]; then
    echo "Setting ENV_CONTENT secret..."
    ENV_CONTENT=$(base64 -i .env | tr -d '\n')
    echo "$ENV_CONTENT" | gh secret set ENV_CONTENT -R "$REPO"
else
    echo ".env file not found!"
    exit 1
fi

# Set GPG_PASSPHRASE secret if not already set
if ! gh secret list -R "$REPO" | grep -q "GPG_PASSPHRASE"; then
    echo "Setting GPG_PASSPHRASE secret..."
    read -sp "Enter GPG passphrase for encrypting environment variables: " GPG_PASS
    echo
    echo "$GPG_PASS" | gh secret set GPG_PASSPHRASE -R "$REPO"
fi

# Check if SSH key exists or needs to be generated
if [ ! -f ~/.ssh/github-actions ] || [ ! -f ~/.ssh/github-actions.pub ]; then
    echo "Generating new SSH key for GitHub Actions..."
    ssh-keygen -t rsa -b 4096 -C "github-actions@notablenomads.com" -f ~/.ssh/github-actions -N ""
fi

# Set SSH_PRIVATE_KEY secret
echo "Setting SSH_PRIVATE_KEY secret..."
gh secret set SSH_PRIVATE_KEY -R "$REPO" < ~/.ssh/github-actions

echo "Done! Now you need to add the public SSH key to your server:"
echo
echo "Run this command to add the key to your server:"
echo "cat ~/.ssh/github-actions.pub | ssh root@91.107.249.14 \"mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys\"" 