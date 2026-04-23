FROM node:20-alpine

# Set working directory
WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy root and package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN pnpm install

# Copy all files
COPY . .

# Build the Web and its dependencies
RUN pnpm build --filter web

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "--filter", "web", "run", "start"]
