#!/bin/bash
set -e

echo "Installing NVM..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Installing Node 24..."
nvm install 24
nvm use 24

echo "Installing npm dependencies..."
npm install --legacy-peer-deps

echo "Building and publishing SDK..."
./gradlew publishToMavenLocal
