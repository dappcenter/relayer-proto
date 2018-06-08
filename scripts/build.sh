#!/bin/bash

set -e

echo ""
echo "It's time to BUILD! All resistance is futile."
echo ""

npm i

# Rebuilds gRPC to for docker target
rm -f ./proto/relayer.proto
npm run proto

echo "Reinitializing lnd-engine docker files"
rm -rf ./docker/btcd
rm -rf ./docker/lnd
rm -f ./docker/docker-compose.yml
rm -f ./docker/LND-README.md

echo "Installing lnd-engine"
git clone git@github.com:kinesis-exchange/lnd-engine.git ./node_modules/lnd-engine

# Remove git file or npm will complain
rm -rf ./node_modules/lnd-engine/.git

# Copy all docker files from lnd-engine and add them to our docker folder
cp -a ./node_modules/lnd-engine/docker/. ./docker
cp ./node_modules/lnd-engine/docker-compose.yml ./docker/lnd-docker-compose.yml

# Rename the readme file for docker
mv ./docker/README.md ./docker/LND-README.md

npm test
