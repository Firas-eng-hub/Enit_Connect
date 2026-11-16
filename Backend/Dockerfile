# ============================================
# TIC-Connect Backend Dockerfile
# Production-ready Node.js/Express API
# ============================================

# Node 22 LTS (Node 18 is end-of-life)
FROM node:22-alpine AS base

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
RUN npm ci --omit=dev && npm cache clean --force

# ============================================
# Production Stage
# ============================================
FROM base AS production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code OWNED BY ROOT and read-only for the app user:
# even with a file-write bug, the nodejs user cannot modify code, config, or
# email templates (pentest M-01 RCE chain). Only /app/uploads is writable.
COPY --chown=root:root . .

RUN chmod -R a-w /app && \
    rm -rf /app/uploads && mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app/uploads && \
    chmod 750 /app/uploads

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
