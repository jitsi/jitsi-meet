#!/bin/bash

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

exec ${THIS_DIR}/../../node_modules/react-native/scripts/launchPackager.command --reset-cache
