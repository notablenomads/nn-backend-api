#!/bin/bash

set -e

# Check if server IP is provided
if [ -z "$1" ]; then
    echo "Error: Server IP is required"
    echo "Usage: $0 <server-ip>"
    exit 1
fi

# Configuration
SERVER_IP="$1"
SERVER_USER="root"
DOMAIN="api.notablenomads.com"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}[INFO] Setting up Nginx configuration...${NC}"

# Create nginx configuration
cat > nginx.conf << EOF
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

# HTTP Server
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Allow ACME challenge for SSL certificate verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Health check endpoint for Docker
    location /v1/health {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${DOMAIN};

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/${DOMAIN}/privkey.pem;
    
    # SSL settings
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security 'max-age=31536000; includeSubDomains' always;

    # Proxy configuration
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /v1/health {
        proxy_pass http://api:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Shorter timeouts for health checks
        proxy_connect_timeout 5s;
        proxy_send_timeout 5s;
        proxy_read_timeout 5s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Copy nginx configuration to server
echo -e "${GREEN}[INFO] Copying Nginx configuration to server...${NC}"
scp nginx.conf "$SERVER_USER@$SERVER_IP:/root/nginx.conf"
rm nginx.conf

# Restart nginx
echo -e "${GREEN}[INFO] Restarting Nginx...${NC}"
ssh "$SERVER_USER@$SERVER_IP" "cd /root && docker-compose restart nginx"

echo -e "${GREEN}[INFO] Nginx setup completed!${NC}" 