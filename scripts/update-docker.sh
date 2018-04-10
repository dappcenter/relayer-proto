#!/bin/bash

set -e

#
# Download the lnd docker files to the projcets `./docker` directory so we can
# overwrite their configs in `docker-compose.yml`
LND_DOCKER_URL=${LND_DOCKER_URL:-https://github.com/lightningnetwork/lnd/trunk/docker}
svn export $LND_DOCKER_URL ./docker-lnd --force
