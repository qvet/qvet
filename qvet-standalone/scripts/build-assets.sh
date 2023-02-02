#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"/../..

pushd qvet-web
npm run build
popd
rm -rf qvet-standalone/include
cp -R qvet-web/dist qvet-standalone/include
