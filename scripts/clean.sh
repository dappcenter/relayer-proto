#!/bin/bash

set -e

echo ""
echo "It's time to (clean) kill!"
echo ""

if [ $(basename $PWD) == 'relayer' ];
then
  rm -f *.log
  echo "Removed all existing .log files from parent directory"
  rm -f ./proto/lnd-rpc.proto
  rm -f ./proto/relayer.proto
  echo "Removed proto files: lnd-rpc and relayer"
else
  echo "You are not in the correct directory to run clean.sh."
fi
