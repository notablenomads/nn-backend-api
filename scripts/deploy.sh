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

# Deployment mode
DEPLOY_MODE="http-only"  # Default to HTTP-only mode

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
    echo "Usage: DOCKER_HUB_TOKEN=<token> $0 <server-ip> [--http-only|--production]"
    echo
    echo "Options:"
    echo "  --http-only    Deploy with HTTP-only configuration (default)"
    echo "  --production   Deploy with HTTPS configuration"
    exit 1
}

# Validate input parameters
if [ -z "$1" ]; then
    log_error "Server IP address is required."
    usage
fi

SERVER_IP="$1"
shift

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --http-only)
            DEPLOY_MODE="http-only"
            shift
            ;;
        --production)
            DEPLOY_MODE="production"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

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

# Step 1: Verify DNS configuration
log_info "Step 1: Verifying DNS configuration"

for DOMAIN in "$API_DOMAIN" "$FRONTEND_DOMAIN"; do
    log_info "Verifying DNS configuration for $DOMAIN..."

    # Check DNS A record
    log_info "Checking DNS A record..."
    CURRENT_IP=$(dig +short ${DOMAIN})

    if [ -z "$CURRENT_IP" ]; then
        log_error "No DNS A record found for $DOMAIN"
        exit 1
    fi

    # Check if the IP is a Cloudflare IP
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
if [ "$DEPLOY_MODE" = "http-only" ]; then
    log_info "Using HTTP-only configuration..."
    cat > nginx.conf.http << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.notablenomads.com;

    location / {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Increase timeouts for long-running requests
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    location /socket.io/ {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # WebSocket specific settings
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 86400;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name notablenomads.com;

    location / {
        proxy_pass http://frontend:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}
EOF
    scp nginx.conf.http "$SERVER_USER@$SERVER_IP:/root/nginx.conf"
else
    log_info "Using HTTPS configuration..."
    scp nginx.conf "$SERVER_USER@$SERVER_IP:/root/nginx.conf"
fi

# Step 5: Prepare server environment
log_info "Step 5: Preparing server environment"
ensure_remote_dir "/root/secrets"

# Step 6: Deploy to server
log_info "Step 6: Deploying to server"
scp docker-compose.yml "$SERVER_USER@$SERVER_IP:/root/"
scp "$ENV_FILE" "$SERVER_USER@$SERVER_IP:$REMOTE_ENV_PATH"
ssh "$SERVER_USER@$SERVER_IP" "chmod 600 $REMOTE_ENV_PATH && ln -sf $REMOTE_ENV_PATH /root/.env"

# Step 7: Execute deployment on server
log_info "Step 7: Setting up Docker Hub authentication on remote server"
ensure_docker_hub_login "remote"

ssh "$SERVER_USER@$SERVER_IP" DOCKER_HUB_TOKEN="$DOCKER_HUB_TOKEN" DOCKER_HUB_USERNAME="$DOCKER_HUB_USERNAME" << 'DEPLOY'
#!/bin/bash

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

cd /root

# Determine docker compose command
if docker compose version &>/dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif docker-compose version &>/dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    log_error "Neither docker compose v2 nor docker-compose v1 is available"
    exit 1
fi

# Login to Docker Hub with passed credentials
log_info "Logging in to Docker Hub..."
if [ -z "$DOCKER_HUB_TOKEN" ] || [ -z "$DOCKER_HUB_USERNAME" ]; then
    log_error "Docker Hub credentials not passed to remote server"
    exit 1
fi

# Ensure we're logged out first to prevent stale credentials
docker logout

# Login with fresh credentials
echo "$DOCKER_HUB_TOKEN" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin || {
    log_error "Failed to log in to Docker Hub"
    exit 1
}

# Stop existing services gracefully
log_info "Stopping existing services..."
$DOCKER_COMPOSE_CMD down --remove-orphans

# Clean up unused images and volumes
log_info "Cleaning up unused resources..."
docker system prune -f

# Remove existing containers to ensure clean state
log_info "Removing existing containers..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

# Pull latest images
log_info "Pulling latest images..."
$DOCKER_COMPOSE_CMD pull

# Start services in order
log_info "Starting services in order..."

# 1. Start PostgreSQL first
log_info "Starting PostgreSQL..."
$DOCKER_COMPOSE_CMD up -d postgres

# Wait for PostgreSQL
log_info "Waiting for PostgreSQL to be healthy..."
timeout=120
while [ $timeout -gt 0 ]; do
    if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_success "PostgreSQL is healthy!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -eq 0 ]; then
    log_error "PostgreSQL failed to become healthy"
    $DOCKER_COMPOSE_CMD logs postgres
    exit 1
fi

# 2. Start API service
log_info "Starting API service..."
$DOCKER_COMPOSE_CMD up -d api

# Wait for API
log_info "Waiting for API to be healthy..."
timeout=120
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:3000/v1/health > /dev/null 2>&1; then
        log_success "API is healthy!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -eq 0 ]; then
    log_error "API health check failed. Checking logs..."
    $DOCKER_COMPOSE_CMD logs api
    exit 1
fi

# 3. Start Frontend
log_info "Starting Frontend..."
$DOCKER_COMPOSE_CMD up -d frontend

# Wait for Frontend
log_info "Waiting for Frontend to start..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:3030 > /dev/null 2>&1; then
        log_success "Frontend is responding!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -eq 0 ]; then
    log_warn "Frontend health check timed out. Checking logs..."
    $DOCKER_COMPOSE_CMD logs frontend
fi

# 4. Finally, start Nginx
log_info "Starting Nginx..."
$DOCKER_COMPOSE_CMD up -d nginx

# Wait for Nginx
log_info "Waiting for Nginx to start..."
timeout=30
while [ $timeout -gt 0 ]; do
    if $DOCKER_COMPOSE_CMD exec -T nginx nginx -t > /dev/null 2>&1; then
        log_success "Nginx configuration is valid!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -eq 0 ]; then
    log_error "Nginx failed to start properly. Checking logs..."
    $DOCKER_COMPOSE_CMD logs nginx
    exit 1
fi

# Final verification
log_info "Verifying all services..."
$DOCKER_COMPOSE_CMD ps

# Check for any containers in unhealthy or exit state
if $DOCKER_COMPOSE_CMD ps | grep -E "(unhealthy|Exit)"; then
    log_error "Some services are not healthy or have exited:"
    $DOCKER_COMPOSE_CMD ps
    log_info "Checking logs for failed services..."
    $DOCKER_COMPOSE_CMD logs
    exit 1
fi

# Clean up Docker Hub credentials for security
docker logout

log_success "All services have been deployed successfully!"

DEPLOY

# Check the exit status of the remote script
if [ $? -ne 0 ]; then
    log_error "Deployment failed! Please check the logs above for details."
    exit 1
fi

log_success "Deployment completed successfully!"
echo -e "\n📝 Next steps:"
if [ "$DEPLOY_MODE" = "http-only" ]; then
    echo "1. Test the deployment: curl http://$API_DOMAIN/v1/health"
    echo "2. Generate SSL certificates: ./scripts/manage-ssl.sh $SERVER_IP --production"
    echo "3. Deploy with HTTPS: DOCKER_HUB_TOKEN=<token> ./scripts/deploy.sh $SERVER_IP --production"
else
    echo "1. Test the deployment: curl -k https://$API_DOMAIN/v1/health"
    echo "2. Monitor the logs: ssh $SERVER_USER@$SERVER_IP '$DOCKER_COMPOSE_CMD logs -f'"
fi

# Function to check parent directory permissions
check_parent_directory_permissions() {
    log_info "Checking parent directory permissions..."
    ssh "$SERVER_USER@$SERVER_IP" "
        # Check /etc permissions
        if [ \$(stat -c '%a' /etc) -lt 755 ]; then
            chmod 755 /etc
        fi
        
        # Ensure /etc/letsencrypt parent exists with correct permissions
        mkdir -p /etc/letsencrypt
        chmod 755 /etc/letsencrypt
        
        # Check selinux context if selinux is enabled
        if command -v getenforce >/dev/null && [ \$(getenforce) != 'Disabled' ]; then
            chcon -Rt etc_t /etc/letsencrypt || true
        fi"
}

# Enhanced SSL permission fix function
fix_ssl_permissions() {
    log_info "Fixing SSL certificate permissions..."
    ssh "$SERVER_USER@$SERVER_IP" "
        # Create ssl-cert group if it doesn't exist
        groupadd -f ssl-cert &&

        # Backup existing certificates
        if [ -d /etc/letsencrypt/archive ]; then
            timestamp=\$(date +%Y%m%d_%H%M%S)
            backup_dir=/root/letsencrypt_backup_\$timestamp
            mkdir -p \$backup_dir
            cp -rp /etc/letsencrypt/archive \$backup_dir/
            cp -rp /etc/letsencrypt/live \$backup_dir/
            log_info 'Created backup at \$backup_dir'
        fi

        # Set base directory permissions
        chown root:ssl-cert /etc/letsencrypt &&
        chmod 755 /etc/letsencrypt &&

        # Create and set permissions for renewal hooks directory
        mkdir -p /etc/letsencrypt/renewal-hooks/{pre,post,deploy}
        chmod 755 /etc/letsencrypt/renewal-hooks
        chmod 755 /etc/letsencrypt/renewal-hooks/{pre,post,deploy}
        chown -R root:ssl-cert /etc/letsencrypt/renewal-hooks

        # Set directory permissions with error handling
        find /etc/letsencrypt/archive -type d -exec chmod 755 {} \; || log_warn 'Some archive directories could not be chmod'
        find /etc/letsencrypt/live -type d -exec chmod 755 {} \; || log_warn 'Some live directories could not be chmod'

        # Set file permissions with error handling
        find /etc/letsencrypt/archive -type f -name 'privkey*.pem' -exec chmod 640 {} \; || log_warn 'Some private keys could not be chmod'
        find /etc/letsencrypt/archive -type f ! -name 'privkey*.pem' -exec chmod 644 {} \; || log_warn 'Some public certificates could not be chmod'
        
        # Set ownership with error handling
        chown -R root:ssl-cert /etc/letsencrypt/archive || log_warn 'Archive ownership could not be set completely'
        chown -R root:ssl-cert /etc/letsencrypt/live || log_warn 'Live ownership could not be set completely'
        
        # Fix symlinks with error handling
        find /etc/letsencrypt/live -type l -exec chown -h root:ssl-cert {} \; || log_warn 'Some symlinks could not be fixed'
        
        # Set SELinux context if enabled
        if command -v selinuxenabled >/dev/null && selinuxenabled; then
            semanage fcontext -a -t cert_t '/etc/letsencrypt/archive(/.*)?'
            semanage fcontext -a -t cert_t '/etc/letsencrypt/live(/.*)?'
            restorecon -R /etc/letsencrypt
        fi
        
        # Verify the changes
        echo 'Verifying permissions:' &&
        ls -lZ /etc/letsencrypt/{live,archive} 2>/dev/null || ls -l /etc/letsencrypt/{live,archive}"
}

# Enhanced verify SSL permissions function
verify_ssl_permissions() {
    local domain="$1"
    log_info "Verifying SSL permissions for $domain..."
    
    if ! ssh "$SERVER_USER@$SERVER_IP" "
        # Check if directory exists
        if [ ! -d /etc/letsencrypt/live/$domain ]; then
            echo 'Directory does not exist'
            exit 1
        fi
        
        # Check parent directory permissions
        [ \$(stat -c '%a' /etc/letsencrypt) = '755' ] &&
        
        # Check directory permissions
        [ \$(stat -c '%a' /etc/letsencrypt/live/$domain) = '755' ] &&
        [ \$(stat -c '%a' /etc/letsencrypt/archive/$domain) = '755' ] &&
        
        # Check group ownership
        [ \$(stat -c '%G' /etc/letsencrypt/live/$domain) = 'ssl-cert' ] &&
        [ \$(stat -c '%G' /etc/letsencrypt/archive/$domain) = 'ssl-cert' ] &&
        
        # Check file permissions
        [ \$(stat -c '%a' /etc/letsencrypt/archive/$domain/privkey1.pem) = '640' ] &&
        [ \$(stat -c '%a' /etc/letsencrypt/archive/$domain/fullchain1.pem) = '644' ] &&
        
        # Check renewal hooks permissions if they exist
        { [ ! -d /etc/letsencrypt/renewal-hooks ] || [ \$(stat -c '%a' /etc/letsencrypt/renewal-hooks) = '755' ]; }"; then
        log_warn "SSL permissions need to be fixed for $domain"
        return 1
    fi
    
    log_success "SSL permissions are correct for $domain"
    return 0
}

# Enhanced nginx permissions function
ensure_nginx_permissions() {
    log_info "Ensuring nginx has proper permissions..."
    ssh "$SERVER_USER@$SERVER_IP" "
        # Ensure ssl-cert group exists
        groupadd -f ssl-cert

        # Ensure nginx user exists and is in ssl-cert group
        if ! getent passwd nginx >/dev/null; then
            log_warn 'nginx user does not exist, it should be created by the nginx container'
        else
            usermod -a -G ssl-cert nginx || true
        fi
        
        # Verify nginx can read the certificates
        if ! su -s /bin/sh nginx -c 'test -r /etc/letsencrypt/live/*/fullchain.pem' 2>/dev/null; then
            log_warn 'Nginx might have issues reading certificates'
            
            # Additional debugging information
            echo 'Current permissions:'
            ls -la /etc/letsencrypt/live/
            echo 'Groups for nginx user:'
            groups nginx || true
            echo 'SELinux context:'
            ls -Z /etc/letsencrypt/live/ 2>/dev/null || true
            
            return 1
        fi
        
        # Verify nginx can traverse the directory structure
        for dir in /etc /etc/letsencrypt /etc/letsencrypt/live /etc/letsencrypt/archive; do
            if [ ! -x \"\$dir\" ]; then
                log_warn \"nginx cannot traverse \$dir\"
                return 1
            fi
        done"
}

# Before starting containers, ensure all permissions are correct
if [ -d "/etc/letsencrypt" ]; then
    # Check parent directory permissions first
    check_parent_directory_permissions
    
    # Verify permissions for both domains
    if ! verify_ssl_permissions "$API_DOMAIN" || ! verify_ssl_permissions "$FRONTEND_DOMAIN"; then
        log_info "Fixing SSL permissions..."
        fix_ssl_permissions
    fi
    
    # Ensure nginx has proper access
    ensure_nginx_permissions
    
    # Double-check permissions after fixes
    if ! verify_ssl_permissions "$API_DOMAIN" || ! verify_ssl_permissions "$FRONTEND_DOMAIN"; then
        log_warn "SSL permissions could not be fixed completely. Manual intervention may be required."
    fi
fi

# Start containers
log_info "Starting containers..."
$DOCKER_COMPOSE_CMD pull && $DOCKER_COMPOSE_CMD up -d

# Monitor container logs
log_info "Monitoring container logs (press Ctrl+C to stop)..."
$DOCKER_COMPOSE_CMD logs -f