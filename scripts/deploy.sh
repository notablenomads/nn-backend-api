#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP=""
SERVER_USER="root"
APP_NAME="nn-backend-api"
FRONTEND_APP_NAME="nn-landing"
API_DOMAIN="api.notablenomads.com"
FRONTEND_DOMAIN="notablenomads.com"
DOCKER_HUB_USERNAME="mrdevx"
REMOTE_ENV_PATH="/root/secrets/.env"
DOCKER_COMPOSE_CMD="docker compose"

# Environment configuration
export NODE_ENV=production
export ENV_FILE=.env.production

# Docker Hub configuration
# Create a token at https://hub.docker.com/settings/security
DOCKER_HUB_TOKEN="${DOCKER_HUB_TOKEN:-}"  # Set this as environment variable or pass it when running the script

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

# Check if required commands exist
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Required command '$1' is not installed."
        exit 1
    fi
}

# Check if command exists on remote server
check_remote_command() {
    if ! ssh "$SERVER_USER@$SERVER_IP" "command -v $1" &>/dev/null; then
        log_error "Command '$1' not found on remote server"
        return 1
    fi
    return 0
}

# Ensure remote directory exists
ensure_remote_dir() {
    local dir="$1"
    ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $dir && chmod 700 $dir"
}

# Check if SSH connection can be established
check_ssh_connection() {
    log_info "Checking SSH connection to $1..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$1" "echo 'SSH connection successful'" &> /dev/null; then
        log_error "Could not establish SSH connection to $1"
        exit 1
    fi
    log_success "SSH connection successful"
}

# Function to ensure Docker Hub login
ensure_docker_hub_login() {
    local target="${1:-local}"  # 'local' or 'remote'
    log_info "Ensuring Docker Hub authentication for $target..."
    
    if [ "$target" = "remote" ]; then
        # Ensure remote server is logged out first to prevent stale credentials
        ssh "$SERVER_USER@$SERVER_IP" "docker logout"
        
        # Login on remote server
        ssh "$SERVER_USER@$SERVER_IP" "echo '$DOCKER_HUB_TOKEN' | docker login -u '$DOCKER_HUB_USERNAME' --password-stdin" || {
            log_error "Failed to authenticate with Docker Hub on remote server"
            return 1
        }
    else
        # Ensure local machine is logged out first
        docker logout
        
        # Login on local machine
        echo "$DOCKER_HUB_TOKEN" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin || {
            log_error "Failed to authenticate with Docker Hub on local machine"
            return 1
        }
    fi
    
    log_success "Docker Hub authentication successful for $target"
    return 0
}

# Print usage
usage() {
    echo "Usage: DOCKER_HUB_TOKEN=<token> $0 <server-ip>"
    exit 1
}

# Validate input parameters
if [ -z "$1" ]; then
    log_error "Server IP address is required."
    usage
fi

SERVER_IP="$1"

# Check Docker Hub token
if [ -z "$DOCKER_HUB_TOKEN" ]; then
    log_error "DOCKER_HUB_TOKEN is not set. Please set it as an environment variable."
    echo "You can create a token at https://hub.docker.com/settings/security"
    exit 1
fi

# Check if .env.production exists and is valid
if [ ! -f "$ENV_FILE" ]; then
    log_error "Production environment file ($ENV_FILE) not found!"
    exit 1
fi

# Validate environment file
if ! grep -q "^NODE_ENV=" "$ENV_FILE"; then
    log_error "Invalid environment file: NODE_ENV not found in $ENV_FILE"
    exit 1
fi

# Function to generate nginx configuration
generate_nginx_config() {
    log_info "Generating nginx configuration..."
    cat > nginx.prod.conf << 'EOL'
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.notablenomads.com notablenomads.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS configuration for API
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name api.notablenomads.com;

    ssl_certificate /etc/letsencrypt/live/api.notablenomads.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.notablenomads.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 1.0.0.1 valid=300s;
    resolver_timeout 5s;

    location / {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
    }

    location /socket.io/ {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 86400;
    }
}

# HTTPS configuration for Frontend
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name notablenomads.com;

    ssl_certificate /etc/letsencrypt/live/notablenomads.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/notablenomads.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 1.0.0.1 valid=300s;
    resolver_timeout 5s;

    location / {
        proxy_pass http://frontend:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
    }
}
EOL
}

# Function to verify SSL certificates
verify_ssl_certificates() {
    local domain="$1"
    log_info "Verifying SSL certificates for $domain..."
    
    if ! ssh "$SERVER_USER@$SERVER_IP" "[ -d /etc/letsencrypt/live/$domain ] && \
        openssl x509 -checkend 2592000 -noout -in /etc/letsencrypt/live/$domain/fullchain.pem"; then
        log_warn "SSL certificate for $domain is missing or will expire within 30 days"
        return 1
    fi
    
    log_success "SSL certificate for $domain is valid"
    return 0
}

# Function to check nginx configuration
verify_nginx_config() {
    log_info "Verifying nginx configuration..."
    if ! ssh "$SERVER_USER@$SERVER_IP" "docker exec root-nginx-1 nginx -t"; then
        log_error "Invalid nginx configuration"
        return 1
    fi
    log_success "Nginx configuration is valid"
    return 0
}

# Step 1: Verify DNS configuration
log_info "Step 1: Verifying DNS configuration"
for DOMAIN in "$API_DOMAIN" "$FRONTEND_DOMAIN"; do
    log_info "Verifying DNS configuration for $DOMAIN..."
    CURRENT_IP=$(dig +short ${DOMAIN})
    if [ -z "$CURRENT_IP" ]; then
        log_error "No DNS A record found for $DOMAIN"
        exit 1
    fi
    if echo "$CURRENT_IP" | grep -qE '^(172\.67\.|104\.21\.|104\.22\.|104\.23\.|104\.24\.|104\.25\.|104\.26\.|104\.27\.|104\.28\.|108\.162\.|162\.158\.|173\.245\.|188\.114\.|190\.93\.|197\.234\.|198\.41\.|199\.27\.|141\.101\.|103\.21\.|103\.22\.|103\.23\.|103\.24\.|103\.25\.|131\.0\.|141\.101\.|190\.93\.|197\.234\.|198\.41\.|199\.27\.)'; then
        log_info "Detected Cloudflare proxy, proceeding with deployment"
    else
        if [ "$CURRENT_IP" != "$SERVER_IP" ]; then
            log_error "DNS A record points to $CURRENT_IP, but server IP is $SERVER_IP"
            exit 1
        fi
    fi
    log_success "DNS configuration is correct for $DOMAIN!"
done

# Check required commands
check_command "docker"
check_command "ssh"
check_command "scp"

# Step 2: Set up Docker Hub authentication
log_info "Step 2: Setting up Docker Hub authentication"
ensure_docker_hub_login "local"

# Step 3: Build and push required images
log_info "Step 3: Building and pushing required images"
log_info "Building API image..."
docker build -t "$DOCKER_HUB_USERNAME/$APP_NAME:latest" .
log_info "Pushing API image..."
docker push "$DOCKER_HUB_USERNAME/$APP_NAME:latest"

log_info "Pulling frontend image..."
docker pull "$DOCKER_HUB_USERNAME/$FRONTEND_APP_NAME:latest"

# Step 4: Prepare nginx configuration
log_info "Step 4: Preparing nginx configuration"
generate_nginx_config
scp "nginx.prod.conf" "$SERVER_USER@$SERVER_IP:/root/nginx.prod.conf"

# Step 5: Prepare server environment
ensure_remote_dir "/root/secrets"
ensure_remote_dir "/etc/nginx/conf.d"

# Step 6: Deploy to server
log_info "Step 6: Deploying to server"
scp "docker-compose.yml" "docker-compose.prod.yml" "$SERVER_USER@$SERVER_IP:/root/"
scp "$ENV_FILE" "$SERVER_USER@$SERVER_IP:$REMOTE_ENV_PATH"
ssh "$SERVER_USER@$SERVER_IP" "chmod 600 $REMOTE_ENV_PATH && ln -sf $REMOTE_ENV_PATH /root/.env"

# Step 7: Execute deployment on server
log_info "Step 7: Setting up Docker Hub authentication on remote server"
ensure_docker_hub_login "remote"

# Step 8: Verify SSL certificates
log_info "Step 8: Verifying SSL certificates"
verify_ssl_certificates "$API_DOMAIN" || {
    log_error "SSL certificate verification failed for $API_DOMAIN"
    exit 1
}
verify_ssl_certificates "$FRONTEND_DOMAIN" || {
    log_error "SSL certificate verification failed for $FRONTEND_DOMAIN"
    exit 1
}

# Step 9: Start services
log_info "Step 9: Starting services"
ssh "$SERVER_USER@$SERVER_IP" "cd /root && \
    export DOCKER_HUB_TOKEN='$DOCKER_HUB_TOKEN' && \
    $DOCKER_COMPOSE_CMD -f docker-compose.yml -f docker-compose.prod.yml pull && \
    $DOCKER_COMPOSE_CMD -f docker-compose.yml -f docker-compose.prod.yml up -d"

# Step 10: Verify deployment
log_info "Step 10: Verifying deployment"
verify_nginx_config || exit 1

log_success "Deployment completed successfully!"
echo -e "\n📝 Next steps:"
echo "1. Test the deployment: curl https://$API_DOMAIN/v1/health"
echo "2. Monitor the logs: ssh $SERVER_USER@$SERVER_IP 'docker compose logs -f'"