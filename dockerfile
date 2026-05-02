# =========================
# Stage 1: Build React app
# =========================
FROM node:24-bullseye AS builder

WORKDIR /app

# Install system dependencies needed by Jitsi build
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy full source code
COPY . .

# Install JS dependencies
RUN npm install

# Build production bundle
RUN make

# =========================
# Stage 2: Production Jitsi Web image
# =========================
FROM jitsi/web:stable-9823

# Copy only our custom-built assets into the Jitsi Web container
COPY --from=builder /app/libs /usr/share/jitsi-meet/libs
COPY --from=builder /app/css/all.css /usr/share/jitsi-meet/css/all.css
COPY --from=builder /app/images /usr/share/jitsi-meet/images
COPY --from=builder /app/fonts /usr/share/jitsi-meet/fonts
COPY --from=builder /app/sounds /usr/share/jitsi-meet/sounds
COPY --from=builder /app/static /usr/share/jitsi-meet/static
COPY --from=builder /app/lang /usr/share/jitsi-meet/lang
COPY --from=builder /app/index.html /usr/share/jitsi-meet/index.html
COPY --from=builder /app/interface_config.js /usr/share/jitsi-meet/interface_config.js
COPY --from=builder /app/manifest.json /usr/share/jitsi-meet/manifest.json
COPY --from=builder /app/pwa-worker.js /usr/share/jitsi-meet/pwa-worker.js
COPY --from=builder /app/title.html /usr/share/jitsi-meet/title.html
COPY --from=builder /app/head.html /usr/share/jitsi-meet/head.html
COPY --from=builder /app/base.html /usr/share/jitsi-meet/base.html
COPY --from=builder /app/body.html /usr/share/jitsi-meet/body.html
COPY --from=builder /app/fonts.html /usr/share/jitsi-meet/fonts.html
COPY --from=builder /app/plugin.head.html /usr/share/jitsi-meet/plugin.head.html