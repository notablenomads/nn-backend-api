# Notable Nomads Backend API

Backend API service for Notable Nomads platform.

## Features

- **AI Chat Service**: Real-time chat interface using Gemini Pro
- **Email Service**: Contact form handling with AWS SES
- **Blog Service**: Medium blog post integration
- **Health Checks**: System health monitoring

## Tech Stack

- **Framework**: NestJS v10
- **Runtime**: Node.js ≥18
- **Package Manager**: Yarn v4.6.0
- **Database**: PostgreSQL 16
- **Container**: Docker & Docker Compose

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- SSH access to deployment server
- Domain with DNS configured

## Environment Variables

Copy `.env.example` to `.env` and adjust the values:

```bash
# Application
NODE_ENV=development
PORT=3000
HOST=localhost
API_PREFIX=v1

# CORS
CORS_ENABLED_DOMAINS=*.notablenomads.com
CORS_RESTRICT=false

# AWS Configuration
***REMOVED***=eu-central-1
***REMOVED***=your_access_key
***REMOVED***=your_secret_key

# Email Configuration
EMAIL_FROM_ADDRESS=noreply@notablenomads.com
EMAIL_TO_ADDRESS=contact@notablenomads.com

# AI Configuration
***REMOVED***=your_gemini_api_key
```

## Development

```bash
# Install dependencies
yarn install

# Run in development mode
yarn start:dev

# Run tests
yarn test

# Run e2e tests
yarn test:e2e

# Lint and format code
yarn lint
yarn format
```

## Deployment

### 1. Main Deployment Script

```bash
# Deploy the application
DOCKER_HUB_TOKEN=<token> ./scripts/deploy.sh <server-ip>
```

### 2. SSL Certificate Management

The project includes two scripts for managing SSL certificates:

#### `scripts/manage-ssl.sh`

Main script for managing SSL certificates across all domains:

```bash
# Test with staging certificates
./scripts/manage-ssl.sh <server-ip> --staging

# Generate production certificates
./scripts/manage-ssl.sh <server-ip> --production

# Force certificate renewal
./scripts/manage-ssl.sh <server-ip> --production --force-renew

# Clean up and regenerate certificates
./scripts/manage-ssl.sh <server-ip> --production --cleanup
```

#### `scripts/ssl-cert.sh`

Server-side script for individual domain certificate operations:

```bash
# Check certificates
./ssl-cert.sh --check

# Force renew certificates
./ssl-cert.sh --force-renew

# Generate new certificates
./ssl-cert.sh --new [--staging]

# Clean up certificates
./ssl-cert.sh --cleanup
```

### 3. Server Cleanup

```bash
# Clean up server (preserves SSL certificates)
./scripts/cleanup.sh <server-ip>

# Force cleanup (removes everything)
./scripts/cleanup.sh <server-ip> --force
```

## Monitoring

```bash
# Follow all logs
ssh root@<server-ip> 'docker compose logs -f'

# Follow specific service logs
ssh root@<server-ip> 'docker compose logs -f api'

# View last N lines
ssh root@<server-ip> 'docker compose logs --tail=100 api'
```

## API Documentation

API documentation is available at `/v1/docs` in non-production environments.

## Security Considerations

1. **Certificate Storage**:

   - Main storage: `/etc/letsencrypt/`
   - Docker volume: `/root/certbot/conf/`

2. **File Permissions**:

   - Certificate files: 644
   - Directories: 755

3. **Backups**:

   - Automatic backup before operations
   - Location: `/root/ssl_backup/<domain>/<timestamp>/`
   - Includes certificates and configurations

4. **SSL/TLS**:
   - Automatic renewal every 90 days
   - Modern cipher configuration
   - HTTP/2 enabled
   - Security headers configured

## Troubleshooting

1. **Certificate Issues**:

```bash
# Check certificate status
ssh root@<server-ip> 'certbot certificates'

# View debug logs
ssh root@<server-ip> 'cat /root/ssl_debug.log'
```

2. **Service Issues**:

```bash
# Check service status
ssh root@<server-ip> 'docker-compose ps'

# View service logs
ssh root@<server-ip> 'docker-compose logs'
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- **Mahdi Rashidi** - _Initial work_ - [mrdevx](https://github.com/mrdevx)
