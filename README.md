# Notable Nomads Backend API

The backend API service for Notable Nomads platform, built with NestJS.

## Features

- **AI Chat Service**: Real-time chat interface using Gemini Pro
- **Email Service**: Contact form handling with AWS SES
- **Blog Service**: Medium blog post integration
- **Health Checks**: System health monitoring

## Tech Stack

- **Framework**: NestJS v10
- **Runtime**: Node.js ≥14
- **Package Manager**: Yarn v4.6.0
- **Cloud Provider**: AWS (ECS Fargate)
- **Infrastructure**: AWS Copilot

## Prerequisites

- Node.js ≥14.0.0
- Yarn v4.6.0
- AWS CLI v2
- AWS Copilot CLI
- Docker

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Application
NODE_ENV=development
PORT=3000
HOST=localhost
API_PREFIX=v1
CORS_ENABLED_DOMAINS=*.notablenomads.com,notablenomads.com
CORS_RESTRICT=false

# AI Configuration
***REMOVED***=your_gemini_api_key_here

# AWS Configuration
***REMOVED***=eu-central-1
***REMOVED***=your_aws_access_key_id
***REMOVED***=your_aws_secret_access_key

# Email Configuration
EMAIL_FROM_ADDRESS=no-reply@mail.notablenomads.com
EMAIL_TO_ADDRESS=contact@notablenomads.com
```

## Installation

```bash
# Install dependencies
yarn install

# Build the application
yarn build

# Start the development server
yarn start:dev
```

## API Endpoints

### Health Check

- `GET /v1/health`: System health status

### Email

- `POST /v1/email/contact`: Submit contact form
  ```typescript
  {
    name: string; // 2-100 characters
    email: string; // Valid email address
    message: string; // 10-5000 characters
  }
  ```

### Blog

- `GET /v1/blog/posts`: Get team blog posts
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Posts per page (default: 10)

### AI Chat

- WebSocket endpoint: `/chat`
- Events:
  - `sendMessage`: Send a chat message
  - `startStream`: Start streaming chat response
  - `messageResponse`: Receive chat response
  - `streamChunk`: Receive streaming response chunk
  - `streamComplete`: Stream completion event

## Development

```bash
# Run tests
yarn test

# Run e2e tests
yarn test:e2e

# Run tests with coverage
yarn test:cov

# Lint code
yarn lint

# Format code
yarn format
```

## Deployment

### Prerequisites

- Node.js ≥18.0.0
- Yarn v4.6.0
- Docker
- GPG (for secure environment management)
- A domain name pointing to your server

### Initial Production Deployment

1. Set up environment variables securely:

   ```bash
   # Encrypt your .env file locally
   gpg --symmetric --cipher-algo AES256 .env
   ```

   You'll be prompted to create an encryption password. Save this password securely!

2. Deploy the application:

   ```bash
   # Deploy the application
   ./deploy.sh your-server-ip
   ```

3. Set up secure environment on the server:

   ```bash
   # Create secure directory
   ssh root@your-server-ip "mkdir -p /root/secrets && chmod 700 /root/secrets"

   # Copy encrypted file
   scp .env.gpg root@your-server-ip:/root/

   # Decrypt on server (you'll be prompted for the password)
   ssh root@your-server-ip "gpg -d /root/.env.gpg > /root/secrets/.env && chmod 600 /root/secrets/.env"
   ```

4. Generate SSL certificate:

   ```bash
   ssh root@your-server-ip "cd /root && ./setup-ssl.sh"
   ```

5. Verify deployment:

   ```bash
   # Check if the API is accessible
   curl https://api.notablenomads.com/v1/health

   # View logs
   ssh root@your-server-ip "docker-compose logs -f"
   ```

### Redeployment Process

When redeploying with environment changes:

1. Update and re-encrypt your local `.env` file:

   ```bash
   # Re-encrypt with any changes
   gpg --symmetric --cipher-algo AES256 .env
   ```

2. Deploy and update environment:

   ```bash
   # Deploy code changes
   ./deploy.sh your-server-ip

   # Update encrypted environment
   scp .env.gpg root@your-server-ip:/root/
   ssh root@your-server-ip "gpg -d /root/.env.gpg > /root/secrets/.env && chmod 600 /root/secrets/.env"

   # Restart services to apply changes
   ssh root@your-server-ip "cd /root && docker-compose restart"
   ```

When redeploying without environment changes:

```bash
# Simply deploy code changes
./deploy.sh your-server-ip
```

### Environment Security

The deployment uses a secure environment setup:

1. **Local Environment**:

   - `.env`: Contains plain text environment variables (never committed)
   - `.env.gpg`: Encrypted version of `.env` (safe to transfer)

2. **Server Environment**:

   - `/root/secrets/.env`: Decrypted environment file (restricted permissions)
   - `/root/.env.gpg`: Encrypted backup (safe to keep)

3. **Security Measures**:
   - Environment variables are encrypted at rest
   - Decrypted file is stored in a restricted directory
   - Secrets directory is mounted read-only in containers
   - Access requires GPG decryption password
   - Regular rotation of encryption passwords recommended

### Environment Management

#### Viewing Variables

```bash
# View encrypted env file content (requires password)
ssh root@your-server-ip "gpg -d /root/.env.gpg"

# View variables in running container
ssh root@your-server-ip "docker-compose exec api env"
```

#### Updating Variables

1. Update your local `.env` file
2. Re-encrypt and deploy:

   ```bash
   # Re-encrypt
   gpg --symmetric --cipher-algo AES256 .env

   # Copy and decrypt on server
   scp .env.gpg root@your-server-ip:/root/
   ssh root@your-server-ip "gpg -d /root/.env.gpg > /root/secrets/.env && chmod 600 /root/secrets/.env"

   # Restart services
   ssh root@your-server-ip "cd /root && docker-compose restart"
   ```

#### Security Best Practices

- Never commit `.env` or `.env.gpg` files
- Store GPG encryption password in a secure password manager
- Rotate encryption passwords regularly (recommended every 90 days)
- Monitor access logs for unauthorized attempts
- Limit SSH access to authorized IPs only
- Regularly audit environment variable access
- Keep encrypted backups of environment files

### Server Configuration

The production server uses the following setup:

- **Web Server**: Nginx (reverse proxy)
- **SSL**: Let's Encrypt (auto-renewal every 12 hours)
- **Container Orchestration**: Docker Compose
- **Health Monitoring**: Built-in health checks
- **Security**:
  - HTTPS redirection
  - HTTP/2 enabled
  - Modern SSL configuration
  - Security headers
  - WebSocket support

### Security Headers

The following security headers are enabled:

```nginx
add_header Strict-Transport-Security "max-age=63072000" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### Troubleshooting

1. If the API is not accessible:

```bash
# Check if containers are running
ssh root@your-server-ip "docker-compose ps"

# Check logs for errors
ssh root@your-server-ip "docker-compose logs"
```

2. If SSL certificate is not working:

```bash
# Verify certificate files exist
ssh root@your-server-ip "ls -la /root/ssl/"

# Check nginx configuration
ssh root@your-server-ip "docker-compose exec nginx nginx -t"

# Regenerate certificate
ssh root@your-server-ip "cd /root && ./setup-ssl.sh"
```

3. If WebSocket connection fails:

```bash
# Check nginx logs for WebSocket errors
ssh root@your-server-ip "docker-compose logs nginx | grep -i websocket"

# Verify WebSocket configuration in nginx.conf
ssh root@your-server-ip "cat /root/nginx.conf | grep -A 10 'proxy_set_header Upgrade'"
```

### Backup

To backup the deployment configuration:

```bash
# Create a backup directory
ssh root@your-server-ip "cd /root && tar -czf backup-\$(date +%Y%m%d).tar.gz docker-compose.yml nginx.conf ssl/"

# Download the backup locally
scp root@your-server-ip:/root/backup-*.tar.gz ./backups/
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Versioning

We use [semantic-release](https://github.com/semantic-release/semantic-release) for versioning. For the versions available, see the [tags on this repository](https://github.com/Notable-Nomads/nn-backend-api/tags).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- **Mahdi Rashidi** - _Initial work_ - [mrdevx](https://github.com/mrdevx)

# Notable Nomads Backend API Deployment

This repository contains the backend API for Notable Nomads along with deployment scripts for managing the application deployment and SSL certificates.

## Deployment Scripts

The deployment process is managed through several scripts in the `scripts/` directory:

### 1. Main Deployment Script (`scripts/deploy.sh`)

The main script for deploying the application to the server.

```bash
# Deploy with staging SSL certificates (for testing)
DOCKER_HUB_TOKEN=your_token_here ./scripts/deploy.sh 91.107.249.14

# Deploy with production SSL certificates
DOCKER_HUB_TOKEN=your_token_here ./scripts/deploy.sh 91.107.249.14 --production
```

This script:

- Verifies DNS configuration
- Builds and pushes Docker image
- Sets up server configuration
- Manages SSL certificates
- Deploys the application

### 2. SSL Certificate Management (`scripts/ssl-cert.sh`)

Dedicated script for managing SSL certificates.

```bash
# Check existing certificates
./ssl-cert.sh

# Force renew existing certificates
./ssl-cert.sh --force-renew

# Generate new staging certificates
./ssl-cert.sh --new --staging

# Generate new production certificates
./ssl-cert.sh --new
```

### 3. Cleanup Script (`scripts/cleanup.sh`)

Script for cleaning up the server environment.

```bash
# Normal cleanup (preserves SSL certificates)
./scripts/cleanup.sh 91.107.249.14

# Force cleanup (removes everything including SSL certificates)
./scripts/cleanup.sh 91.107.249.14 --force
```

## Directory Structure

```
.
├── scripts/
│   ├── deploy.sh      # Main deployment script
│   ├── ssl-cert.sh    # SSL certificate management
│   └── cleanup.sh     # Server cleanup script
├── docker-compose.yml # Docker services configuration
├── nginx.conf        # Nginx reverse proxy configuration
└── .env             # Environment variables
```

## Deployment Process

1. **Prerequisites**:

   - Docker Hub account and access token
   - Domain name pointing to your server (A record)
   - SSH access to the server

2. **Initial Deployment**:

   ```bash
   # First deployment with staging certificates
   DOCKER_HUB_TOKEN=your_token_here ./scripts/deploy.sh 91.107.249.14

   # Once verified, deploy with production certificates
   DOCKER_HUB_TOKEN=your_token_here ./scripts/deploy.sh 91.107.249.14 --production
   ```

3. **SSL Certificate Management**:

   ```bash
   # On the server, you can manage certificates
   cd /root
   ./ssl-cert.sh --force-renew  # Renew certificates
   ./ssl-cert.sh --new          # Generate new certificates
   ```

4. **Cleanup If Needed**:

   ```bash
   # Clean up while preserving certificates
   ./scripts/cleanup.sh 91.107.249.14

   # Full cleanup including certificates
   ./scripts/cleanup.sh 91.107.249.14 --force
   ```

## Configuration Files

### docker-compose.yml

Contains service definitions for:

- API service (Node.js application)
- Nginx reverse proxy
- SSL certificate management

### nginx.conf

Nginx configuration including:

- SSL/TLS settings
- Proxy settings
- Security headers
- HTTP to HTTPS redirection

### .env

Environment variables for:

- API configuration
- Database settings
- Other application settings

## Troubleshooting

1. **SSL Certificate Issues**:

   ```bash
   # Check certificate status
   ./ssl-cert.sh

   # Force certificate renewal
   ./ssl-cert.sh --force-renew
   ```

2. **Deployment Issues**:

   ```bash
   # Check logs
   ssh root@91.107.249.14 'docker-compose logs'

   # Clean up and retry
   ./scripts/cleanup.sh 91.107.249.14
   DOCKER_HUB_TOKEN=your_token_here ./scripts/deploy.sh 91.107.249.14 --production
   ```

3. **Container Health Checks**:

   ```bash
   # Check container status
   ssh root@91.107.249.14 'docker-compose ps'

   # Check specific service logs
   ssh root@91.107.249.14 'docker-compose logs api'
   ```

## Security Notes

1. Always store sensitive information in `.env` files
2. Use Docker Hub tokens instead of passwords
3. Keep SSL certificates backed up
4. Use production certificates only after staging is verified
5. Regularly update dependencies and Docker images

## Maintenance

1. **Certificate Renewal**:

   - SSL certificates auto-renew every 3 months
   - Force renewal if needed: `./ssl-cert.sh --force-renew`

2. **Updates**:

   - Regular deployment updates the application
   - Use cleanup script before major updates

3. **Backups**:
   - SSL certificates are automatically backed up
   - Database backups should be configured separately

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
