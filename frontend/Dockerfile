# ============================================
# ENIT-Connect Frontend Dockerfile
# Multi-stage build: React + Vite + Nginx
# ============================================

# ============================================
# Stage 1: Build React Application
# ============================================
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build-time API URL injection (useful for Render image deployments)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build React application for production
# Vite outputs to dist/ folder
RUN npm run build

# ============================================
# Stage 2: Production Nginx Server
# ============================================
FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# SPA config with security headers / CSP
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
