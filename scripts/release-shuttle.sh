#!/bin/bash

set -euxo pipefail

cd "$(dirname "$0")"/..


eprintln() {
  local message="$1"
  >&2 echo "$message"
}

usage () {
  eprintln "usage: ./release-shuttle.sh --version 0.1.4"
}

VERSION=

parse_args () {
  while [ $# -gt 0 ]; do
    local argname="$1"
    case "$argname" in
      --version)
        VERSION="$2"
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        usage
        eprintln ""
        eprintln "fatal: invalid argument '$1'"
        exit 1
        ;;
    esac
    shift
  done
}

parse_args "$@"

if [[ -z "$VERSION" ]]; then
  eprintln "--version must be given"
  exit 1
fi

eprintln "Building qvet-standalone assets"
./qvet-standalone/scripts/build-assets.sh

eprintln "Bumping qvet-standalone version"
pushd qvet-standalone
cargo set-version "$VERSION" --package qvet-standalone
popd

eprintln "Publishing qvet-standalone"
git add -u
git commit -m "release: publish qvet-standalone v$VERSION"
# --allow-dirty is to allow update of included assets
cargo publish -p qvet-standalone --allow-dirty

eprintln "Deploying shuttle"
cd qvet-shuttle
cargo upgrade -p "qvet-standalone@$VERSION" --incompatible allow
cargo set-version "$VERSION" --package qvet-shuttle
git add -u
git commit -m "release: deploy qvet-shuttle v$VERSION"
cargo shuttle deploy

# Set tag in git history
git tag -a "v$VERSION" -m "v$VERSION"
