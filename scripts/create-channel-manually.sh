#!/usr/bin/env bash

##########################################
#
# This file contains logic to open a channel with a specified broker using its
# host/publickey info for LND.
#
# You can find this information using `./bin/kcli config`
#
# Environment:
# BROKER_PATH - directory where your broker application lives
# CHANNEL_BALANCE - banace to use for the channel to the relayer. This defaults
#                   to the max channel value for LND, 16777215 satoshis
#
# You will be prompted for the following information when running the script:
#
# DESTINATION_HOST - host address for the broker
# DESTINATION_PUB_KEY - Engine public key for the broker
#
#
##########################################

set -e -u

ENV='DEV'
BROKER_PATH=${BROKER_PATH:="../broker"}
CHANNEL_BALANCE=${CHANNEL_BALANCE:=16777215}

echo -n "Destination *Lightning* Host: "
read DESTINATION_HOST

echo -n "Destination *Lightning* public key: "
read DESTINATION_PUB_KEY

echo -n "Currency Symbol: "
read SYMBOL

echo "Create channel to $DESTINATION_HOST with $CHANNEL_BALANCE (sat) in $SYMBOL"

docker-compose exec -T relayer bash -c "node ./scripts/create-channel-manually.js $DESTINATION_HOST $DESTINATION_PUB_KEY $SYMBOL $CHANNEL_BALANCE"

echo "Restarting the relayer"

docker-compose up -d --force-recreate

if [ $ENV = 'DEV' ]; then
  echo "Restarting the broker (development only)"
  (cd $BROKER_PATH && docker-compose up -d --force-recreate)
fi
