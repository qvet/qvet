#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"/../..

./qvet-standalone/scripts/build-assets.sh

pushd qvet-standalone
cargo build --locked --release --target x86_64-unknown-linux-musl
popd

docker build -t qvet-standalone -f qvet-standalone/Dockerfile .
