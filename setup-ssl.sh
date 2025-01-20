#!/bin/bash

DOMAIN="api.platform.notablenomads.com"
EMAIL="contact@notablenomads.com"

# Stop nginx temporarily
docker-compose stop nginx

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot
fi

# Create ssl directory
mkdir -p ssl

# Get the certificate using standalone mode
certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --preferred-challenges http \
    -d $DOMAIN

# Copy certificates to nginx ssl directory
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/

# Set proper permissions
chmod 644 ssl/*

# Start nginx
docker-compose up -d nginx

# Setup auto-renewal
(crontab -l 2>/dev/null; echo "0 12 * * * certbot renew --quiet --standalone --pre-hook 'docker-compose stop nginx' --post-hook 'docker-compose up -d nginx && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /root/ssl/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /root/ssl/'") | crontab -

echo "SSL certificate has been obtained and installed!" 