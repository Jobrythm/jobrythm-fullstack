# Build stage - Frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Build stage - Backend
FROM node:22-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY package*.json ./
RUN npm ci

# Copy backend source
COPY src/ ./src/
COPY tsconfig.json ./

# Build backend
RUN npm run build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

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
