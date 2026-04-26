# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Browser calls same-origin /api; nginx proxies using API_URL (1|2|3) at runtime (see docker-compose.yml).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Clean up default static files
RUN rm -rf ./*

# Copy built files from build stage
COPY --from=build /app/dist .

# Create data directory for persistence
RUN mkdir -p /var/lib/jobrythm/data && chown nginx:nginx /var/lib/jobrythm/data

# Copy custom Nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default backend preset if compose does not set API_URL (1 = local, 2 = staging, 3 = prod)
ENV API_URL=2

COPY docker/docker-entrypoint-wrapper.sh /docker-entrypoint-wrapper.sh
RUN chmod +x /docker-entrypoint-wrapper.sh

# Expose port 80
EXPOSE 80

# Wrapper exports NGINX_API_UPSTREAM from API_URL (1|2|3), then runs stock nginx entrypoint + envsubst
ENTRYPOINT ["/docker-entrypoint-wrapper.sh"]
CMD ["nginx", "-g", "daemon off;"]
