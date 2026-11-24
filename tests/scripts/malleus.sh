#!/bin/sh
# Forwards to the malleus CLI (../malleus/cli.ts). Run `npm run malleus -- --help` for usage.
cd "$(dirname "$0")/.." && exec npm run malleus -- "$@"
