#!/bin/sh

# Tarball (Ziel)
TARGET=./adfc-meet.tar.gz

# Sources
HTML="./*.html ./LICENSE"
CSS="./css/all.css"
#CONFIG="./*config.js"
CONFIG=""
IMG="./favicon.ico ./images/*"
FONTS="./fonts/*"
JS="./libs/*"
LANG="./lang/*"
SOUNDS="./sounds/*"
STATIC="./static/*"

tar -czf $TARGET $HTML $CSS $CONFIG $IMG $FONTS $JS $LANG $SOUNDS $STATIC
