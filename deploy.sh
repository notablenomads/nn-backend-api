#!/bin/bash

# Configuration
SERVER_IP=""
SERVER_USER="root"
APP_NAME="nn-backend-api"
DOMAIN="api.platform.notablenomads.com"

# Check if SERVER_IP is provided
if [ -z "$1" ]; then
    echo "Please provide the server IP address as an argument"
    echo "Usage: ./deploy.sh <server-ip>"
    exit 1
else
    SERVER_IP=$1
fi

echo "🚀 Starting deployment to Hetzner server at $SERVER_IP..."

# Build Docker image
echo "📦 Building Docker image..."
docker build -t $APP_NAME .

# Save the image to a tar file
echo "💾 Saving Docker image..."
docker save $APP_NAME > ${APP_NAME}.tar

# Create required directories on the server
echo "📁 Creating required directories..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p ~/certbot/conf ~/certbot/www"

# Copy files to the server
echo "📤 Copying files to server..."
scp ${APP_NAME}.tar $SERVER_USER@$SERVER_IP:/root/
scp .env $SERVER_USER@$SERVER_IP:/root/
scp docker-compose.yml $SERVER_USER@$SERVER_IP:/root/
scp nginx.conf $SERVER_USER@$SERVER_IP:/root/

# Execute remote commands
echo "🔧 Setting up application on server..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker for Ubuntu 22.04..."
        # Remove any old versions
        for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
            apt-get remove -y $pkg || true
        done

        # Add Docker's official GPG key
        apt-get update
        apt-get install -y ca-certificates curl gnupg
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg

        # Add the repository to Apt sources
        echo \
          "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
          tee /etc/apt/sources.list.d/docker.list > /dev/null

        # Install Docker packages
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

        # Start and enable Docker service
        systemctl start docker
        systemctl enable docker

        # Add current user to docker group
        usermod -aG docker $USER

        echo "Docker installed successfully!"
    fi

    # Install Docker Compose if not present (using Docker Compose plugin instead of standalone)
    if ! command -v docker-compose &> /dev/null; then
        echo "Setting up Docker Compose..."
        # Create symbolic link for docker compose plugin
        ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
        echo "Docker Compose setup completed!"
    fi

    # Load the Docker image
    docker load < ${APP_NAME}.tar
    rm ${APP_NAME}.tar

    # Install curl for healthcheck
    apt-get install -y curl

    # Stop any running containers and remove old certificates
    docker-compose down
    rm -rf /root/certbot/conf/live /root/certbot/conf/archive

    # Create dummy certificates (with proper directory structure)
    mkdir -p /root/certbot/conf/live/api.platform.notablenomads.com
    mkdir -p /root/certbot/conf/archive/api.platform.notablenomads.com
    
    openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
        -keyout /root/certbot/conf/live/api.platform.notablenomads.com/privkey.pem \
        -out /root/certbot/conf/live/api.platform.notablenomads.com/fullchain.pem \
        -subj "/CN=api.platform.notablenomads.com"

    # Ensure proper permissions
    chmod -R 755 /root/certbot/conf
    chmod -R 755 /root/certbot/www

    # Start Nginx with dummy certificates
    docker-compose up -d nginx

    # Wait for Nginx to start
    echo "Waiting for Nginx to start..."
    sleep 10

    # Request the actual SSL certificate
    docker-compose run --rm certbot certonly \
        --webroot --webroot-path /var/www/certbot \
        --email contact@notablenomads.com --agree-tos --no-eff-email \
        --force-renewal \
        -d api.platform.notablenomads.com

    # Start all services
    docker-compose up -d

    # Setup auto-renewal cron job
    (crontab -l 2>/dev/null; echo "0 12 * * * cd $(pwd) && docker-compose run --rm certbot renew --quiet && docker-compose exec nginx nginx -s reload") | crontab -

    # Clean up old images
    docker image prune -f

    echo "✨ Server setup completed!"
ENDSSH

# Clean up local tar file
rm ${APP_NAME}.tar

echo "✅ Deployment completed successfully!"
echo "🌍 Your application should now be running at https://$DOMAIN"
echo "
📝 Next steps:
1. Make sure your domain's DNS A record points to: $SERVER_IP
2. Test the API endpoint: curl https://$DOMAIN/v1/health
3. Monitor the logs with: ssh $SERVER_USER@$SERVER_IP 'docker-compose logs -f'
" 