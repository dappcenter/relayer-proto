#!/usr/bin/env bash

##########################################
#
# This file contains logic to fund a wallet on SIMNET w/ the default LND setup for the relayer.
#
# Information in this script is based off the LND docker setup:
# https://github.com/lightningnetwork/lnd/tree/master/docker
#
# NOTE: This script is incomplete because of the `--noencryptwallet` flag that is
#       included in the lnd_btc container. If this flag was removed, we would need to
#       create a wallet w/ pass and nmemonic
#
##########################################

set -e -u


WALLET_ADDR=${WALLET_ADDR:-}

if [[ -n "$WALLET_ADDR" ]]; then
  echo "Using provided wallet address for funding: ${WALLET_ADDR}"
  ADDR="$WALLET_ADDR"
else
  echo "Generating new deposit address through relayer"
  ADDR=$(docker-compose exec -T relayer bash -c 'node ./scripts/new-address.js')
fi

# Given the address generated above, we can now restart btcd to mine
MINING_ADDRESS="$ADDR" docker-compose up -d btcd

GENERATE_CMD='btcctl --simnet --rpcuser="$RPC_USER" --rpcpass="$RPC_PASS" --rpccert="$RPC_CERT" generate 400'
docker-compose exec -T btcd /bin/sh -c "$GENERATE_CMD"

echo "Waiting 5 seconds for funds to drop..."
sleep 5

echo "Checking balance of relayer"

docker-compose exec relayer bash -c 'node ./scripts/balance.js'

echo "restarting btcd to reset mining address"

MINING_ADDRESS="" docker-compose up -d btcd

unset WALLET_ADDR
