#!/bin/bash
# UAE Anglers Hub — Species Photo Watcher launcher
# Used by the LaunchAgent to ensure correct environment

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

cd /Users/josephmafofo/Documents/Official/UAEAngler/uae-anglers-hub || exit 1

NODE_BIN="$HOME/.nvm/versions/node/v20.19.4/bin/node"
exec "$NODE_BIN" scripts/watch-species-photos.js
