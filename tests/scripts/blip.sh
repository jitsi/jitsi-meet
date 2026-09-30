#!/bin/sh

if [ -n "$DEBUG" ]; then
  set -x
fi

# This is a non-functional placeholder script that needs to be replaced with one
# that is designed for your specific infrastructure. The command line parameters
# that are necessary for malleus to function properly are listed
# bellow. You can further customize your script with environment variables.

usage() {
    echo "Usage: $0 --duration=DURATION --bridge-ips=IP1[,IP2,...]" >&2
    exit 1
}

usage
