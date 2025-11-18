# Stage 1: Build
FROM node:lts-alpine AS build

# Add build arguments for sensitive values needed during build
ARG NODE_ENV
ARG JWT_SECRET
ARG JWT_REFRESH_SECRET
ARG ENCRYPTION_KEY

# Set only necessary environment variables for build
ENV NODE_ENV=${NODE_ENV}
ENV DOCKER=true

# Set the working directory inside the container
WORKDIR /app

# Enable Corepack and use the specified Yarn version
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy package manager configuration files
COPY package.json yarn.lock .yarnrc.yml ./

# Copy Yarn berry files (if applicable)
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install 

# Copy the entire application code
COPY . .

# Build the application
RUN yarn build

# Verify the build output exists and resources are copied
RUN ls -la dist && \
    if [ ! -f dist/main.js ]; then \
    echo "dist/main.js not found!" && exit 1; \
    fi && \
    if [ ! -d dist/resources ]; then \
    echo "dist/resources directory not found!" && exit 1; \
    fi

# Stage 2: Run
FROM node:lts-alpine AS production

# Add build arguments for sensitive values needed during build
ARG NODE_ENV
ARG JWT_SECRET
ARG JWT_REFRESH_SECRET
ARG ENCRYPTION_KEY

# Set only necessary environment variables for runtime
ENV NODE_ENV=${NODE_ENV}
ENV DOCKER=true

# Install wget and curl for health checks
RUN apk add --no-cache wget curl

# Set the working directory inside the container
WORKDIR /app

# Enable Corepack and use the specified Yarn version
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy necessary files from the build stage
COPY --from=build /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=build /app/.yarn ./.yarn
COPY --from=build /app/dist ./dist
COPY --from=build /app/typeorm.config.ts ./
COPY --from=build /app/tsconfig.json ./

# Install only necessary production dependencies
RUN yarn workspaces focus 

# Create a directory for migrations
RUN mkdir -p dist/app/database/migrations

# Verify the main file exists and resources are present
RUN ls -la dist && \
    if [ ! -f dist/main.js ]; then \
    echo "dist/main.js not found!" && exit 1; \
    fi && \
    if [ ! -d dist/resources ]; then \
    echo "dist/resources directory not found!" && exit 1; \
    fi

# Expose the application port
EXPOSE 3000

# Start the application in production mode
CMD ["node", "dist/main.js"]