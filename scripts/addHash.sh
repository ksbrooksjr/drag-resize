#! /usr/bin/env bash

set -euo pipefail
VERSION=$(jq -r .version < package.json)
HASH=$(openssl dgst -sha384 -binary dist/index.js | openssl base64 -A | xargs -n 1 -I {} echo "sha384-{}")
sed -i "" -E -e "s|integrity=".*"|integrity=\"$HASH\"|" ./README.md
git add .
git commit -m "Updated the integrity hash for version $VERSION"