# Build stage - Frontend
FROM node:22-slim AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Build stage - Backend
FROM node:22-slim AS backend-builder

WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy backend package files
COPY package*.json ./
RUN npm ci

# Copy backend source
COPY src/ ./src/
COPY tsconfig.json ./

# Build backend
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Runtime stage
FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy node_modules from builder (already has production deps)
COPY --from=backend-builder /app/node_modules ./node_modules

# Copy built backend
COPY --from=backend-builder /app/dist ./dist

# Copy built frontend to public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/server.js"]
