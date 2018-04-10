#!/usr/bin/env bash

# exit from script if error was raised.
set -e

# error function is used within a bash function in order to send the error
# mesage directly to the stderr output and exit.
error() {
    echo "$1" > /dev/stderr
    exit 0
}

# return is used within bash function in order to return the value.
return() {
    echo "$1"
}

# set_default function gives the ability to move the setting of default
# env variable from docker file to the script thereby giving the ability to the
# user override it durin container start.
set_default() {
    # docker initialized env variables with blank string and we can't just
    # use -z flag as usually.
    BLANK_STRING='""'

    VARIABLE="$1"
    DEFAULT="$2"

    if [[ -z "$VARIABLE" || "$VARIABLE" == "$BLANK_STRING" ]]; then

        if [ -z "$DEFAULT" ]; then
            error "You should specify default variable"
        else
            VARIABLE="$DEFAULT"
        fi
    fi

   return "$VARIABLE"
}

# Set default variables if needed.
RPCUSERA=$(set_default "$RPCUSERA" "devuser")
RPCPASSA=$(set_default "$RPCPASSA" "devpass")
RPCUSERB=$(set_default "$RPCUSERB" "devuser")
RPCPASSB=$(set_default "$RPCPASSB" "devpass")
DEBUG=$(set_default "$DEBUG" "debug")
NETWORK=$(set_default "$NETWORK" "simnet")
CHAINA=$(set_default "$CHAINA" "bitcoin")
CHAINB=$(set_default "$CHAINB" "litecoin")

PARAMS=$(echo \
    "--noencryptwallet" \
    "--logdir=/data" \
    "--datadir=/lnd" \
    "--adminmacaroonpath=/rpc/admin.macaroon" \
    "--tlscertpath=/rpc/lndrpc.cert" \
    "--tlskeypath=/rpc/lndrpc.key" \
    "--rpclisten=0.0.0.0" \
    "--$CHAINA.rpccert=/rpc/rpc.cert" \
    "--$CHAINA.active" \
    "--$CHAINA.$NETWORK" \
    "--$CHAINA.rpchost=blockchaina" \
    "--$CHAINA.rpcuser=$RPCUSERA" \
    "--$CHAINA.rpcpass=$RPCPASSA" \
    "--$CHAINB.rpccert=/rpc/rpc.cert" \
    "--$CHAINB.active" \
    "--$CHAINB.$NETWORK" \
    "--$CHAINB.rpchost=blockchainb" \
    "--$CHAINB.rpcuser=$RPCUSERB" \
    "--$CHAINB.rpcpass=$RPCPASSB" \
    "--debuglevel=$DEBUG" \
    "--nobootstrap"
)

# Set the mining flag only if address is non empty.
if [[ -n "$HOST" ]]; then
    PARAMS="$PARAMS --externalip=$HOST"
fi

# Add user parameters to command.
PARAMS="$PARAMS $@"


# Print command and start node.
echo "Command: lnd $PARAMS"
lnd $PARAMS
