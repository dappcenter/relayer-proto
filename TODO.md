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

### SSL/TLS

Authentication for LND happens on the server side. We will generate a client cert (tls.cert) and a private server key (tls.key). Only the LND_BTC instance needs to know about both keys.

Our NODEJS client will then use the tls.key + a macaroon to make requests

The macaroon auth will fail if the db/macaroons are not created at the same time, so we need to wipe out the /secure/ folder before each new run (this is OK for internal)

Using `GRPC_VERBOSITY=DEBUG` and `GRPC_TRACE=all` on the relayer was my best friend

```
openssl s_client -connect lnd_btc:10009 -prexit

apt-get update && apt-get install tcpdump
tcpdump port 10009 and '(tcp-syn|tcp-ack)!=0'

curl --cacert /secure/tls.cert https://lnd_btc:10009 -v
```
