# ─── Stage 1: Install dependencies ───────────────────────────────────────────
# Use a specific version for reproducible builds
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first — this layer is cached unless deps change
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Install dumb-init for proper signal handling (important for graceful shutdown)
RUN apk add --no-cache dumb-init

# Create a non-root user for security (principle of least privilege)
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:appgroup . .

# Create the data directory for SQLite and set correct permissions
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

# Persist SQLite DB across container restarts via a Docker volume
# (declared in docker-compose.yml)
VOLUME ["/app/data"]

# Switch to non-root user
USER appuser

# Expose API port
EXPOSE 4000

# Health check: poll the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# dumb-init as PID 1 to properly handle signals (SIGTERM for graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
