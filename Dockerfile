# Stage 1: Build
FROM node:lts-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Enable Corepack and use the specified Yarn version
RUN corepack enable && corepack prepare yarn@stable --activate

# Copy package manager configuration files
COPY package.json yarn.lock .yarnrc.yml ./

# Copy Yarn berry files (if applicable)
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install --immutable

# Copy the entire application code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Run
FROM node:lts-alpine AS production

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

# Install only necessary production dependencies
RUN yarn workspaces focus 

# Expose the application port
EXPOSE 3000

# Start the application in production mode
CMD ["yarn", "start:prod"]