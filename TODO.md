### TODOS

- Contribute to LND for dockerfile updates (easy win)
- Create Dockerfiles for Nodejs and Mongo (we shouldnt trust public images in the future)
- Replace Glide w/ dep for docker lnd/btc/lnd-multichain (this should be done in the lnd repo too for the first contribution!!!!)
- Add lnd-payment-driver to this repo
- Add tests for all modules
- Clone private repo for proto [info here](https://stackoverflow.com/questions/23391839/clone-private-git-repo-with-dockerfile)
- Setup Test runs and builds w/ Circle CI
- Replace eventemitter w/ servicebus? (or some kind of managed pubsub)
  - This will need to happen to be able to run more than 1 relayer node
- Add dev util to track dependencies (and when we should update them)
- Add dev util to post test rpc commands
