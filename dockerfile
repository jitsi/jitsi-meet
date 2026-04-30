# =========================
# Stage 1: Build React app
# =========================
FROM node:18-bullseye AS builder

WORKDIR /app

# Install system dependencies needed by Jitsi build
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy full source code (your modified React app)
COPY . .

# Install JS dependencies
RUN npm install

# Build production bundle (React + your custom features/plugins)
RUN make

# =========================
# Stage 2: Production Nginx image
# =========================
FROM nginx:alpine

# Copy built frontend assets
COPY --from=builder /app/build /usr/share/jitsi-meet

# Jitsi nginx config (required for routing)
COPY resources/nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose web port
EXPOSE 80