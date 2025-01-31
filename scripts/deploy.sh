#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP=""
SERVER_USER="root"
APP_NAME="nn-backend-api"
DOMAIN="api.notablenomads.com"
DOCKER_HUB_USERNAME="mrdevx"

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

# Check if SSH connection can be established
check_ssh_connection() {
    if ! ssh -o ConnectTimeout=10 "$1" "echo 'SSH connection successful'" &> /dev/null; then
        log_error "Could not establish SSH connection to $1"
        exit 1
    fi
}

# Docker Hub login function
docker_login() {
    local host="$1"
    if [ -z "$DOCKER_HUB_TOKEN" ]; then
        log_error "DOCKER_HUB_TOKEN is not set. Please set it as an environment variable or pass it when running the script."
        echo "You can create a token at https://hub.docker.com/settings/security"
        exit 1
    fi
    echo "$DOCKER_HUB_TOKEN" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin "$host"
}

# Validate input parameters
if [ -z "$1" ]; then
    log_error "Server IP address is required."
    echo "Usage: DOCKER_HUB_TOKEN=<token> $0 <server-ip>"
    exit 1
fi

SERVER_IP="$1"

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    log_error "Production environment file ($ENV_FILE) not found!"
    exit 1
fi

# Step 1: Verify DNS configuration
log_info "Step 1: Verifying DNS configuration"
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

log_success "DNS configuration is correct!"

# Check required commands
check_command "docker"
check_command "ssh"
check_command "scp"

# Step 2: Build and push Docker image
log_info "Step 2: Building and pushing Docker image"

# Login to Docker Hub locally
log_info "Logging in to Docker Hub locally..."
docker_login ""

log_info "Building and pushing Docker image..."
docker build -t "$DOCKER_HUB_USERNAME/$APP_NAME:latest" .
docker push "$DOCKER_HUB_USERNAME/$APP_NAME:latest"

log_info "Logging out from Docker Hub locally..."
docker logout

log_success "Successfully built and pushed image $DOCKER_HUB_USERNAME/$APP_NAME:latest"

# Step 3: Set up server
log_info "Step 3: Setting up server"
check_ssh_connection "$SERVER_USER@$SERVER_IP"

# Create required directories
log_info "Creating required directories..."
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p /root/certbot/conf /root/certbot/logs"

# Login to Docker Hub on remote server
log_info "Setting up Docker Hub authentication on remote server..."
ssh "$SERVER_USER@$SERVER_IP" "echo '$DOCKER_HUB_TOKEN' | docker login -u '$DOCKER_HUB_USERNAME' --password-stdin"

# Copy configuration files
log_info "Copying configuration files..."
scp docker-compose.yml nginx.conf "$SERVER_USER@$SERVER_IP:/root/"

# Create a temporary script for remote execution
cat << 'EOF' > /tmp/remote_deploy.sh
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

# Ensure environment file exists and has correct permissions
if [ ! -f ".env.production" ]; then
    log_error "Production environment file not found!"
    exit 1
fi

# Make sure the .env file is removed before copying
rm -f .env
cp .env.production .env
chmod 600 .env

# Export environment variables for use in script
export $(cat .env | grep -v '^#' | xargs)

# Verify environment file contents
log_info "Verifying environment file..."
required_vars=("DATABASE_USERNAME" "DATABASE_PASSWORD" "DATABASE_NAME" "DATABASE_HOST")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Required variable $var is not set in environment file!"
        exit 1
    fi
done

# Stop and remove existing containers
log_info "Cleaning up existing containers..."
docker-compose down -v || true
docker rm -f $(docker ps -aq) 2>/dev/null || true

# Remove existing volumes to ensure clean state
log_info "Cleaning up volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# Pull latest images
log_info "Pulling latest images..."
docker-compose pull

# After cleaning up containers and volumes
log_info "Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for PostgreSQL to be healthy
log_info "Waiting for PostgreSQL to be healthy..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker-compose exec postgres pg_isready -U postgres -h localhost > /dev/null 2>&1; then
        log_success "PostgreSQL is healthy!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -eq 0 ]; then
    log_error "PostgreSQL failed to become healthy"
    docker-compose logs postgres
    exit 1
fi

# Verify PostgreSQL connection with credentials
log_info "Verifying PostgreSQL connection..."
if ! docker-compose exec postgres psql -U postgres -d nn-backend-db -c '\conninfo' > /dev/null 2>&1; then
    log_error "Failed to connect to PostgreSQL with configured credentials. Checking connection details..."
    docker-compose exec postgres psql -U postgres -c '\l'
    docker-compose logs postgres
    exit 1
fi

# Verify database exists
log_info "Verifying database exists..."
if ! docker-compose exec postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw nn-backend-db; then
    log_info "Database does not exist, creating..."
    docker-compose exec postgres createdb -U postgres nn-backend-db
fi

# Start the API service separately
log_info "Starting API service..."
docker-compose up -d api

# Wait for API to start
log_info "Waiting for API to initialize..."
sleep 10

# Check API logs for database connection
log_info "Checking API database connection..."
if docker-compose logs api | grep -q "Unable to connect to the database"; then
    log_error "API failed to connect to the database. Logs:"
    docker-compose logs api
    exit 1
fi

# Start remaining services
log_info "Starting remaining services..."
docker-compose up -d

# Verify deployment
log_info "Verifying deployment..."
timeout=120
while [ $timeout -gt 0 ]; do
    if curl -sk http://localhost:3000/v1/health > /dev/null; then
        log_success "API is healthy!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
    
    # Check if API container is marked as unhealthy
    if docker-compose ps api | grep -q "(unhealthy)"; then
        log_error "API container is unhealthy. Checking logs..."
        docker-compose logs api
        exit 1
    fi
done

if [ $timeout -eq 0 ]; then
    log_error "Health check failed. Full logs:"
    echo "API Logs:"
    docker-compose logs api
    echo "PostgreSQL Logs:"
    docker-compose logs postgres
    exit 1
fi
EOF

# Copy and execute the remote script
log_info "Executing deployment on remote server..."
scp /tmp/remote_deploy.sh "$SERVER_USER@$SERVER_IP:/root/remote_deploy.sh"
ssh "$SERVER_USER@$SERVER_IP" "chmod +x /root/remote_deploy.sh && /root/remote_deploy.sh"

# Clean up
rm /tmp/remote_deploy.sh

log_success "Deployment completed successfully!"
echo -e "\n🌍 Your application should now be running at https://$DOMAIN"
echo -e "\n📝 Next steps:"
echo "1. Verify your domain's DNS A record points to: $SERVER_IP"
echo "2. Test the API endpoint: curl -k https://$DOMAIN/v1/health"
echo "3. Monitor the logs with: ssh $SERVER_USER@$SERVER_IP 'docker-compose logs -f'"
echo "4. If needed, run 'scripts/manage-ssl.sh' to handle SSL certificates"