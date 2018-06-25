#!/usr/bin/env bash

##########################################
#
# This file contains logic to update a chain to a specific symbol
# host/publickey info for LND.
#
# You can find this information using `docker-compose exec relayer bash -c 'node ./test-client-scripts/test-lnd.js'`
#
##########################################

set -e -u

docker-compose exec -T relayer bash -c "node ./scripts/send-funds.js $LND_PUBLIC_KEY"
