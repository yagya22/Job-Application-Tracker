# ─── Stage 1: Build the React app ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps (cached layer)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
# Output is in /app/dist

# ─── Stage 2: Serve with Nginx ────────────────────────────────────────────────
# Using a minimal Nginx image — no Node.js in production, just static files
FROM nginx:1.27-alpine AS runtime

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx runs on port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
