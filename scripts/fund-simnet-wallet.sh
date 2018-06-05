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

echo "Generating new deposit address through relayer"

WALLET_ADDR=$(docker-compose exec -T relayer bash -c 'node ./scripts/new-address.js')

# Given the address generated above, we can now restart btcd to mine
MINING_ADDRESS="$WALLET_ADDR" docker-compose up -d btcd

GENERATE_CMD='btcctl --simnet --rpcuser="$RPC_USER" --rpcpass="$RPC_PASS" --rpccert="$RPC_CERT" generate 400'
docker-compose exec -T btcd /bin/sh -c "$GENERATE_CMD"

echo "Waiting 5 seconds for funds to drop..."
sleep 5

echo "Checking balance of relayer"

docker-compose exec relayer bash -c 'node ./scripts/balance.js'
