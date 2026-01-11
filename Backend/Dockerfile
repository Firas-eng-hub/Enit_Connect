# ============================================
# TIC-Connect Backend Dockerfile
# Production-ready Node.js/Express API
# ============================================

# Use Node 18 Alpine for smaller image size
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling and curl for healthcheck
RUN apk add --no-cache dumb-init curl

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# ============================================
# Dependencies Stage
# ============================================
FROM base AS dependencies

# Copy package files first (Docker layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# ============================================
# Production Stage
# ============================================
FROM base AS production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code
COPY --chown=nodejs:nodejs . .

# Create uploads directory with correct permissions
RUN mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app/uploads && \
    chmod -R 755 /app/uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check using curl (installed in alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
