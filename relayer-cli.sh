set -e -u

COMMAND=${1:-'help'}

if [ $COMMAND = 'info' ]; then
  docker-compose exec relayer bash -c 'node ./test-client-scripts/info.js'
elif [ $COMMAND = 'invoices' ]; then
  docker-compose exec relayer bash -c 'node ./test-client-scripts/invoices.js'
elif [ $COMMAND = 'channels' ]; then
  docker-compose exec relayer bash -c 'node ./test-client-scripts/channels.js'
elif [ $COMMAND = 'publickey' ]; then
  docker-compose exec relayer bash -c 'node ./test-client-scripts/get-public-key.js'
else
  echo ''
  echo 'RELAYER CLI - COMMANDS'
  echo ''
  echo 'relayer-cli info - shows info for the relayer'
  echo 'relayer-cli invoices - shows all invoices'
  echo 'relayer-cli channels - shows all channels'
  echo 'relayer-cli publickey - shows public key of the relayer'
  echo ''
fi
