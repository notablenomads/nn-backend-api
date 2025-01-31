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

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_warn "No .env file found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_success "Created .env file from .env.example"
    else
        log_error ".env.example file not found!"
        exit 1
    fi
fi

# Export environment variables
export ENV_FILE=".env"
export NODE_ENV="development"

log_info "Starting development environment..."

# Check if containers are already running
if docker-compose ps | grep -q "Up"; then
    log_warn "Containers are already running. Stopping them..."
    docker-compose down
fi

# Start the services
log_info "Starting services..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
log_info "Waiting for PostgreSQL to be ready..."
timeout=30
while [ $timeout -gt 0 ]; do
    if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -eq 0 ]; then
    log_error "PostgreSQL failed to start"
    docker-compose logs postgres
    exit 1
fi

log_success "Development environment is ready!"
echo -e "\n📝 Next steps:"
echo "1. Your database is running at localhost:${DATABASE_PORT:-5432}"
echo "2. Run 'npm run start:dev' to start the API in development mode"
echo "3. Monitor the logs with: docker-compose logs -f"
echo "4. Stop the environment with: docker-compose down" 