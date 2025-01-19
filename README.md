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
GEMINI_API_KEY=your_gemini_api_key_here

# AWS Configuration
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

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

### Automated Deployment

The application is automatically deployed when:

1. A new release is published on GitHub
2. A new version tag (v\*) is pushed to the main branch

#### Setting up GitHub Actions

1. Generate SSH key for GitHub Actions:

   ```bash
   # Generate new SSH key
   ssh-keygen -t rsa -b 4096 -C "github-actions@notablenomads.com" -f github-actions

   # Add public key to server
   cat github-actions.pub | ssh root@your-server-ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"

   # Copy private key content (to add to GitHub Secrets)
   cat github-actions
   ```

2. Add required GitHub Secrets:

   - `SSH_PRIVATE_KEY`: The private key content from step 1
   - `ENV_CONTENT`: Base64-encoded content of .env file
     ```bash
     base64 -i .env | tr -d '\n' | pbcopy
     ```
   - `GPG_PASSPHRASE`: Passphrase for GPG encryption

3. Add secrets in GitHub:
   - Go to your repository
   - Navigate to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Add each secret with its corresponding value

To trigger a deployment:

```bash
# Create and push a new version tag
git tag v1.0.0
git push origin v1.0.0

# Or create a new release through GitHub's interface
# Go to Releases > Draft a new release
```

### Manual Deployment

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
   curl https://api.platform.notablenomads.com/v1/health

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
