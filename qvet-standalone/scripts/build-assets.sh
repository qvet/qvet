#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"/../..

# Build web assets
pushd qvet-web
npm run build
popd

# Copy web assets into standalone include location
rm -rf qvet-standalone/include
cp -R qvet-web/dist qvet-standalone/include

# Compute a versioned hash of these assets (used for cache busting)
cd qvet-standalone/include
find . -type f | sort | xargs sha1sum | sha1sum > version
cp version version-uncached
