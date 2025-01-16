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

The project uses AWS Copilot for deployment. The service runs on AWS ECS Fargate.

```bash
# Deploy to production
copilot deploy --env production

# View service logs
copilot svc logs

# View service status
copilot svc status

# View service metrics
copilot svc metrics
```

### Infrastructure

- **Service Type**: Backend Service
- **Compute**: AWS Fargate
- **Memory**: 512 MiB
- **CPU**: 256 units
- **Networking**: Private subnet with public IP

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
