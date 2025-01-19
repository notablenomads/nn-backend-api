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

### Prerequisites

- Node.js ≥18.0.0
- Yarn v4.6.0
- Docker
- A domain name pointing to your server

### Production Deployment (Hetzner)

1. Initial Deployment:

```bash
# Deploy the application
./deploy.sh your-server-ip

# Generate SSL certificate
ssh root@your-server-ip "cd /root && ./setup-ssl.sh"
```

2. Verify Deployment:

```bash
# Check if the API is accessible
curl https://api.platform.notablenomads.com/v1/health

# View logs
ssh root@your-server-ip "docker-compose logs -f"
```

### Maintenance Commands

#### Service Management

```bash
# Restart all services
ssh root@your-server-ip "cd /root && docker-compose restart"

# Stop all services
ssh root@your-server-ip "cd /root && docker-compose down"

# Start all services
ssh root@your-server-ip "cd /root && docker-compose up -d"

# View real-time logs
ssh root@your-server-ip "docker-compose logs -f"

# View logs for a specific service (api, nginx)
ssh root@your-server-ip "docker-compose logs -f api"
ssh root@your-server-ip "docker-compose logs -f nginx"
```

#### SSL Certificate Management

```bash
# Check certificate expiration
ssh root@your-server-ip "openssl x509 -in /root/ssl/fullchain.pem -noout -dates"

# Check certificate validity period
ssh root@your-server-ip "openssl x509 -in /root/ssl/fullchain.pem -text -noout | grep -A2 'Validity'"

# Manually renew certificate (if needed)
ssh root@your-server-ip "cd /root && ./setup-ssl.sh"

# View certificate renewal schedule
ssh root@your-server-ip "crontab -l"
```

#### Monitoring

```bash
# Check API health
curl https://api.platform.notablenomads.com/v1/health

# Monitor resource usage
ssh root@your-server-ip "docker stats"

# Check running containers
ssh root@your-server-ip "docker-compose ps"

# View nginx access logs
ssh root@your-server-ip "docker-compose exec nginx tail -f /var/log/nginx/access.log"

# View nginx error logs
ssh root@your-server-ip "docker-compose exec nginx tail -f /var/log/nginx/error.log"
```

#### Deployment Files

The following files are used for deployment:

- `deploy.sh`: Main deployment script
- `docker-compose.yml`: Docker services configuration
- `nginx.conf`: Nginx reverse proxy configuration
- `setup-ssl.sh`: SSL certificate setup script

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
