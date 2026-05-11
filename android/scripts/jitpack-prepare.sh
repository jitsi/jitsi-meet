#!/bin/bash
set -e

echo "System Info:"
lsb_release -a || cat /etc/os-release
ldd --version

# Node.js version to install
# Node 16.20.2 is the last version that supports GLIBC 2.23 (Ubuntu 16.04)
NODE_VERSION="v16.20.2"
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
