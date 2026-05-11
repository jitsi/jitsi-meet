#!/bin/bash
set -e

# Node.js version to install
NODE_VERSION="v24.0.0"
PLATFORM="linux-x64"

echo "Downloading Node.js $NODE_VERSION..."
# Use /tmp to avoid permission issues and keep the build directory clean
mkdir -p /home/jitpack/node
curl -fsSL https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-$PLATFORM.tar.xz | tar -xJ -C /home/jitpack/node --strip-components=1

# Add Node to PATH for this script session
export PATH="/home/jitpack/node/bin:$PATH"

echo "Verifying Node.js version..."
node -v
npm -v

echo "Installing npm dependencies..."
# Use --no-audit and --no-fund to speed up and reduce output
cd ..
npm install --legacy-peer-deps --no-audit --no-fund

echo "Building and publishing SDK..."
cd android
./gradlew publishToMavenLocal
