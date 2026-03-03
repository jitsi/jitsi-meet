#!/bin/bash
#
# Fishmeet React Native SDK build script
#
# Applies fishmeet SVG overrides to react/features/base/icons/svg/, then
# runs `npm pack` inside react-native-sdk/.
#
# Usage:
#   ./build.fishmeet-rnsdk.sh [--pack-destination <path>]
#
#   --pack-destination  Optional. Directory where the .tgz will be placed.
#                       Typically the packages/ folder of your gt-jitsisdk
#                       clone. When omitted, the .tgz lands in react-native-sdk/.
#
# Example:
#   ./build.fishmeet-rnsdk.sh --pack-destination ../gt-jitsisdk/packages/
#

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FISHMEET_DIR="$PROJECT_DIR/fishmeet"

echo "=== Fishmeet React Native SDK Build ==="
echo "Project directory: $PROJECT_DIR"

# Apply fishmeet react/ overrides (SVGs, styles, components, etc.).
# CSS overrides (fishmeet/css/) are web-only and are not needed here.
if [ -d "$FISHMEET_DIR/react" ]; then
    echo "Copying fishmeet react/ overrides..."
    rsync -r "$FISHMEET_DIR/react/" "$PROJECT_DIR/react/"
else
    echo "Warning: fishmeet/react directory not found, skipping."
fi

# Populate real dependency versions from the root package.json into the SDK
# package.json (replaces 0.0.0 placeholders).  This mirrors what
# resources/update-mobile-rnsdk-version.sh does before a release.
echo "Updating SDK dependency versions..."
cd "$PROJECT_DIR/react-native-sdk"
node update_sdk_dependencies.js

# Pack the SDK.  Forward all arguments so callers can pass --pack-destination
# or any other npm-pack flags.
echo "Packing React Native SDK..."
npm pack "$@"

echo "=== Fishmeet React Native SDK Build Complete ==="
