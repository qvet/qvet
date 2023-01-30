#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"/../..

mkdir -p standalone/

pushd qvet-web
npm run build
popd
rm -rf qvet-standalone/include
cp -R qvet-web/dist qvet-standalone/include

pushd qvet-standalone
cargo build --locked --release --target x86_64-unknown-linux-musl
popd

docker build -t qvet-standalone -f qvet-standalone/Dockerfile .
