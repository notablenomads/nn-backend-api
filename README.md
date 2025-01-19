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

## Docker and Infrastructure Deployment

### Building and Pushing Docker Image

```bash
# Build the Docker image
docker build -t nn-backend-api .

# Log in to AWS ECR (replace with your AWS region)
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin YOUR_AWS_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com

# Tag the image (replace with your ECR repository URI)
docker tag nn-backend-api:latest YOUR_AWS_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/nn-backend-api:latest

# Push the image to ECR
docker push YOUR_AWS_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/nn-backend-api:latest
```

### Terraform Deployment

The infrastructure is managed using Terraform. The configuration is organized in environments (staging/production) and modules.

```bash
# Initialize Terraform
cd terraform/environments/[staging|production]
terraform init

# Plan the deployment
terraform plan -var-file=terraform.tfvars

# Apply the changes
terraform apply -var-file=terraform.tfvars

# Destroy infrastructure (if needed)
terraform destroy -var-file=terraform.tfvars
```

#### Infrastructure Components

The Terraform configuration manages the following AWS resources:

- ECS Fargate cluster and service
- Application Load Balancer
- VPC and networking components
- IAM roles and policies
- ECR repository
- CloudWatch logs

#### Environment-specific Configuration

Environment-specific variables are stored in `terraform.tfvars` files:

- `terraform/environments/staging/terraform.tfvars`
- `terraform/environments/production/terraform.tfvars`

Update these files with your specific configuration values before deployment.

## Deployment on Hetzner

### Prerequisites

1. A Hetzner Cloud account
2. Docker installed on your local machine
3. SSH access to your Hetzner server

### Initial Server Setup

1. Create a new server on Hetzner Cloud:

   - Choose Ubuntu 22.04 or Debian 11
   - Select your preferred server size (CX11 is good for starting)
   - Add your SSH key during creation

2. Once the server is created, SSH into it:

   ```bash
   ssh root@your-server-ip
   ```

3. Install Docker and Docker Compose:

   ```bash
   # Update package list
   apt update
   apt upgrade -y

   # Install required packages
   apt install -y apt-transport-https ca-certificates curl software-properties-common

   # Add Docker's official GPG key
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

   # Add Docker repository
   echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

   # Install Docker
   apt update
   apt install -y docker-ce docker-ce-cli containerd.io

   # Start and enable Docker
   systemctl start docker
   systemctl enable docker
   ```

### Deployment Steps

1. Build your Docker image locally:

   ```bash
   docker build -t nn-backend-api .
   ```

2. Tag your image:

   ```bash
   docker tag nn-backend-api your-registry/nn-backend-api:latest
   ```

3. Push your code to the server:

   ```bash
   # Option 1: Using Docker Hub (requires Docker Hub account)
   docker push your-registry/nn-backend-api:latest

   # Option 2: Direct transfer to server (recommended for small teams)
   docker save nn-backend-api | ssh root@your-server-ip 'docker load'
   ```

4. On the server, create a docker-compose.yml file:

   ```yaml
   version: '3.8'
   services:
     api:
       image: nn-backend-api:latest
       restart: always
       ports:
         - '3000:3000'
       env_file:
         - .env
   ```

5. Copy your .env file to the server:

   ```bash
   scp .env root@your-server-ip:/root/.env
   ```

6. Run the application:
   ```bash
   docker-compose up -d
   ```

### Setting up Nginx (Optional but Recommended)

1. Install Nginx:

   ```bash
   apt install -y nginx
   ```

2. Create Nginx configuration:

   ```bash
   nano /etc/nginx/sites-available/nn-backend-api
   ```

   Add the following configuration:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Enable the site:
   ```bash
   ln -s /etc/nginx/sites-available/nn-backend-api /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

### SSL Setup with Certbot (Recommended)

1. Install Certbot:

   ```bash
   apt install -y certbot python3-certbot-nginx
   ```

2. Obtain SSL certificate:
   ```bash
   certbot --nginx -d your-domain.com
   ```

### Maintenance

- To update the application:

  ```bash
  # Pull new image
  docker pull your-registry/nn-backend-api:latest

  # Restart containers
  docker-compose down
  docker-compose up -d
  ```

- To view logs:
  ```bash
  docker-compose logs -f
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
