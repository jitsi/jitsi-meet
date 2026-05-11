#!/bin/bash
set -e

echo "System Info:"
lsb_release -a || cat /etc/os-release
ldd --version

# Node.js version to install
# Let's try Node 20 which is more widely supported
NODE_VERSION="v20.11.1"
PLATFORM="linux-x64"

echo "Downloading Node.js $NODE_VERSION..."
mkdir -p /home/jitpack/node
curl -fsSL https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-$PLATFORM.tar.xz | tar -xJ -C /home/jitpack/node --strip-components=1

# Add Node to PATH
export PATH="/home/jitpack/node/bin:$PATH"

echo "Verifying Node.js version..."
node -v
npm -v

echo "Installing npm dependencies..."
cd ..
npm install --legacy-peer-deps --no-audit --no-fund

echo "Building and publishing SDK..."
cd android
./gradlew publishToMavenLocal
