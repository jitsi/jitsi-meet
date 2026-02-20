#!/bin/bash
#
# Fishmeet build script
# Copies fishmeet overrides to their destinations, then runs make
#

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FISHMEET_DIR="$PROJECT_DIR/fishmeet"

echo "=== Fishmeet Build ==="
echo "Project directory: $PROJECT_DIR"

# Copy CSS overrides
if [ -d "$FISHMEET_DIR/css" ]; then
    echo "Copying CSS overrides from fishmeet/css/ to css/..."
    cp -v "$FISHMEET_DIR/css/"_*.scss "$PROJECT_DIR/css/"
fi

# Copy SVG overrides
if [ -d "$FISHMEET_DIR/react/features/base/icons/svg" ]; then
    echo "Copying SVG overrides..."
    cp -v "$FISHMEET_DIR/react/features/base/icons/svg/"*.svg "$PROJECT_DIR/react/features/base/icons/svg/"
fi

# Stamp build date into fishmeet/index.html in place.
# Replaces the entire "<!-- fishmeet build: ... -->" comment so repeated
# builds work without needing to restore a placeholder.
BUILD_DATE=$(date '+%Y-%m-%d %H:%M:%S %Z')
echo "Stamping build date: $BUILD_DATE"
BUILD_STAMP="<!-- fishmeet build: $BUILD_DATE -->"
sed -i "s|<!-- fishmeet build: .* -->|$BUILD_STAMP|" "$FISHMEET_DIR/index.html"

# Run make
echo "Running make..."
cd "$PROJECT_DIR"
make "$@"

echo "=== Fishmeet Build Complete ==="
