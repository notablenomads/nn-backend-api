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

### Managing Environment Variables

```bash
# Set or update a variable
./scripts/manage-env.sh <server-ip> --set KEY=VALUE

# Get a variable's value
./scripts/manage-env.sh <server-ip> --get KEY

# Backup current environment
./scripts/manage-env.sh <server-ip> --backup

# Restore from backup
./scripts/manage-env.sh <server-ip> --restore env_backup_file.env
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

```bash
# Deploy the application
DOCKER_HUB_TOKEN=<token> ./scripts/deploy.sh <server-ip>

# SSL certificate management
./scripts/manage-ssl.sh <server-ip> --production

# Server cleanup (preserves SSL certificates)
./scripts/cleanup.sh <server-ip>
```

## Monitoring

```bash
# Follow all logs
ssh root@<server-ip> 'docker compose logs -f'

# Follow specific service logs
ssh root@<server-ip> 'docker compose logs -f api'
```

## API Documentation

API documentation is available at `/v1/docs` in non-production environments.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
