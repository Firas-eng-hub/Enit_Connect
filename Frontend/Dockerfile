# ============================================
# TIC-Connect Frontend Dockerfile
# Multi-stage build: Angular 10 + Nginx
# ============================================

# ============================================
# Stage 1: Build Angular Application
# ============================================
FROM node:16-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for Docker layer caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Use --legacy-peer-deps to handle @agm/core compatibility with Angular 10
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build Angular application for production
# Angular 10 outputs to dist/Frontend (project name)
RUN npm run build -- --configuration=production

# Debug: List build output
RUN ls -la /app/dist/ || echo "dist folder not found"

# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy built files from correct path (angular.json outputPath is "dist")
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a simple default nginx config (will be overridden by volume mount)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    \
    location /api/ { \
    proxy_pass http://backend:3000/; \
    proxy_http_version 1.1; \
    proxy_set_header Upgrade $http_upgrade; \
    proxy_set_header Connection "upgrade"; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    proxy_set_header X-Forwarded-Proto $scheme; \
    client_max_body_size 10M; \
    } \
    \
    location /uploads/ { \
    proxy_pass http://backend:3000/uploads/; \
    proxy_set_header Host $host; \
    proxy_set_header X-Real-IP $remote_addr; \
    } \
    }' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
