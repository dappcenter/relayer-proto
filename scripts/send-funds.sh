#!/usr/bin/env bash

##########################################
#
# Contains a script to send a specified amount of BTC (only) to an LND address
#
# Usage: `LND_PUBLIC_KEY=<your pub key> AMOUNT_IN_BTC=10 bash ./send-funds.sh`
#
# Params:
# - LND_PUBLIC_KEY (required)
# - AMOUNT (required)
#
##########################################

set -e -u

echo -n "Destination *Lightning* public key: "
read LND_PUBLIC_KEY

echo -n "Amount to send (in BTC)"
read AMOUNT

docker-compose exec -T relayer bash -c "node ./scripts/send-funds.js $LND_PUBLIC_KEY $AMOUNT"
