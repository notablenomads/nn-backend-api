#!/bin/bash

# Exit on any error
set -e

# Configuration
SERVER_IP=""
SERVER_USER="root"
DOMAIN="api.platform.notablenomads.com"
EMAIL="contact@notablenomads.com"
CERTBOT_DIR="/root/certbot"
USE_STAGING=true  # Set to false for production certificates

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
log_info() { echo -e "${GREEN}ℹ️ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Required command '$1' is not installed"
        exit 1
    fi
}

# Function to check SSH connection
check_ssh_connection() {
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=accept-new $SERVER_USER@$SERVER_IP "echo 2>&1"; then
        log_error "Cannot establish SSH connection to $SERVER_USER@$SERVER_IP"
        exit 1
    fi
}

# Function to check domain DNS
check_domain_dns() {
    local domain=$1
    local expected_ip=$2
    local resolved_ip

    log_info "Checking DNS for $domain..."
    resolved_ip=$(dig +short $domain)

    if [ -z "$resolved_ip" ]; then
        log_error "Could not resolve domain $domain"
        return 1
    fi

    if [ "$resolved_ip" != "$expected_ip" ]; then
        log_error "Domain $domain resolves to $resolved_ip, expected $expected_ip"
        return 1
    fi

    return 0
}

# Validation checks
if [ -z "$1" ]; then
    log_error "Please provide the server IP address as an argument"
    echo "Usage: ./setup-ssl.sh <server-ip> [--production]"
    exit 1
else
    SERVER_IP=$1
fi

# Check if --production flag is provided
if [ "$2" = "--production" ]; then
    USE_STAGING=false
    log_info "Using production Let's Encrypt environment"
else
    log_warn "Using staging Let's Encrypt environment (use --production flag for production certificates)"
fi

# Check required commands
check_command ssh
check_command scp
check_command dig

# Check SSH connection before proceeding
log_info "Checking SSH connection..."
check_ssh_connection

# Check domain DNS configuration
if ! check_domain_dns $DOMAIN $SERVER_IP; then
    log_warn "Proceeding anyway, but SSL setup might fail if DNS is not properly configured"
fi

# First, create a temporary HTTP-only nginx config for certbot verification
log_info "Creating temporary nginx config for SSL setup..."
cat > nginx.ssl.conf << EOL
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Allow ACME challenge only
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Proxy all other traffic to the API
    location / {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket timeout configuration
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOL

# Create docker-compose config with certbot
log_info "Creating SSL-enabled docker-compose config..."
cat > docker-compose.ssl.yml << EOL
services:
  api:
    image: mrdevx/nn-backend-api:latest
    restart: always
    networks:
      - app-network
    env_file:
      - /root/secrets/.env
    volumes:
      - /root/secrets:/run/secrets:ro
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/v1/health']
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'

  nginx:
    image: nginx:stable-alpine
    restart: always
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot/conf:/etc/nginx/ssl:ro
      - ./certbot/www:/var/www/certbot:ro
    networks:
      - app-network
    depends_on:
      - api
    command: >
      sh -c 'while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g "daemon off;"'

  certbot:
    image: certbot/certbot:latest
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - nginx

networks:
  app-network:
    driver: bridge
EOL

# Copy files and set up SSL
log_info "Setting up SSL on the server..."
ssh -o ConnectTimeout=60 $SERVER_USER@$SERVER_IP /bin/bash << 'EOF'
    cd /root

    # Backup existing configuration
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir=/root/backups/$timestamp
    mkdir -p $backup_dir
    
    if [ -f nginx.conf ]; then
        cp nginx.conf $backup_dir/nginx.conf.bak
    fi
    if [ -f docker-compose.yml ]; then
        cp docker-compose.yml $backup_dir/docker-compose.yml.bak
    fi
    if [ -d certbot ]; then
        cp -r certbot $backup_dir/certbot.bak
    fi

    echo 'Creating directories...'
    mkdir -p certbot/conf certbot/www

    echo 'Stopping existing containers...'
    docker-compose down || true
EOF

# Copy new configurations
log_info "Copying SSL configurations..."
scp -o ConnectTimeout=60 nginx.ssl.conf $SERVER_USER@$SERVER_IP:/root/nginx.conf
scp -o ConnectTimeout=60 docker-compose.ssl.yml $SERVER_USER@$SERVER_IP:/root/docker-compose.yml

# Continue SSL setup on server
log_info "Obtaining SSL certificate..."
ssh -o ConnectTimeout=60 $SERVER_USER@$SERVER_IP /bin/bash << EOF
    cd /root

    echo 'Starting nginx...'
    docker-compose up -d nginx
    sleep 5

    echo 'Obtaining SSL certificate...'
    STAGING_FLAG=""
    if [ "$USE_STAGING" = true ]; then
        STAGING_FLAG="--test-cert"
    fi

    docker-compose run --rm certbot certonly \
        --webroot --webroot-path /var/www/certbot \
        --email ${EMAIL} --agree-tos --no-eff-email \
        --force-renewal \$STAGING_FLAG \
        -d ${DOMAIN}

    # Find the actual certificate directory
    CERT_DIR=\$(find ${CERTBOT_DIR}/conf/live -type d -name '${DOMAIN}*' | sort -r | head -n1)
    if [ -z "\$CERT_DIR" ]; then
        echo 'Error: Could not find SSL certificate directory'
        exit 1
    fi
    CERT_NAME=\$(basename "\$CERT_DIR")

    echo "Using certificate directory: \$CERT_NAME"

    echo 'Creating final nginx configuration...'
    cat > nginx.conf << EONG
map \\\$http_upgrade \\\$connection_upgrade {
    default upgrade;
    ''      close;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Allow ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\\\$host\\\$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name ${DOMAIN};

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/live/\$CERT_NAME/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/\$CERT_NAME/privkey.pem;

    # SSL Security Configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS Configuration
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Proxy Configuration
    location / {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \\\$connection_upgrade;
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;

        # WebSocket timeout configuration
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EONG

    echo 'Restarting services with SSL...'
    docker-compose up -d

    echo 'Setting up SSL auto-renewal...'
    (crontab -l 2>/dev/null | grep -v "docker-compose.*certbot.*renew"; echo "0 12 * * * cd /root && docker-compose run --rm certbot renew \$STAGING_FLAG --quiet && docker-compose exec nginx nginx -s reload") | crontab -

    # Verify SSL certificate
    if ! echo | openssl s_client -connect localhost:443 -servername ${DOMAIN} > /dev/null 2>&1; then
        echo 'Warning: SSL certificate verification failed'
    else
        echo 'SSL certificate verified successfully'
    fi

    echo 'SSL setup completed successfully!'
EOF

# Clean up local temporary files
rm -f nginx.ssl.conf docker-compose.ssl.yml

log_info "SSL setup completed successfully!"
if [ "$USE_STAGING" = true ]; then
    log_warn "This is a staging certificate and will show as untrusted in browsers."
    log_warn "Run './setup-ssl.sh $SERVER_IP --production' to get a trusted certificate."
fi

echo -e "
🌍 Your application should now be running at https://$DOMAIN

📝 Next steps:
1. Test the HTTPS endpoint: curl https://$DOMAIN/v1/health
2. Monitor the logs with: ssh $SERVER_USER@$SERVER_IP 'docker-compose logs -f'
3. SSL certificate will auto-renew every day at 12:00

💡 SSL Certificate Details:
- Location: ${CERTBOT_DIR}/conf/live/${DOMAIN}
- Auto-renewal: Daily at 12:00
- Renewal Script: Configured in root's crontab
" 