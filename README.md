# Kinesis Relayer

#### Getting started

Install NVM and run `nvm install 8` to pick up the latest LTS version of node (we will be upgrading to 10 in the future)

After nvm is installed, use `nvm use` to switch to the current node version for this project.

Additionally, we use MongoDB as our data store. You will need to run `brew install mongodb`.

Additionally, Additionally, you will need to install `wget` to run the build command below. Install wget w/ brew `brew install wget`

Install dependencies w/ `npm i` and then build the project with `npm run build`. The former command will initialize the protocol buffers for LND and Relayer as well as run tests against the project to make sure everything is setup properly

After all of these steps! You can finally run `docker-compose up -d`

### Terminology

- Server - gRPC server
- Implementations - action handlers for events provided by gRPC proto
- Service - gRPC service
- Relayer Events - any action that is triggered by implementations
- Relayer Subscriptions - client hooks for actions emitted by the relayer

### Documentation

The following documents are materials that we have followed for developing this application

- [gRPC NodeJS](https://grpc.io/grpc/node/grpc.Server.html#addService)
- [NodeJS Directory Structure Best Practices](https://blog.risingstack.com/node-hero-node-js-project-structure-tutorial/)
- [gRPC basic - Bidirectional Streaming](https://grpc.io/docs/guides/concepts.html#bidirectional-streaming-rpc)
- [Protocol Buffer 3 basics](https://developers.google.com/protocol-buffers/docs/proto3)
- [Protocol Buffer dev guide](https://developers.google.com/protocol-buffers/docs/overview)
- [LND w/ NodeJS](https://github.com/lightningnetwork/lnd/blob/master/docs/grpc/javascript.md)
- [LND API Reference](http://api.lightning.community/)
- [BigInteger so we can support int64](https://github.com/peterolson/BigInteger.js)
- [Adding methods to mongoose schemas](http://mongoosejs.com/docs/2.7.x/docs/methods-statics.html)
- [Mongo DB Compass](https://www.mongodb.com/download-center#compass)
- [Creating a lightning network cluster w/ docker](https://github.com/lightningnetwork/lnd/tree/master/docker)
- [Docker Compose v3 reference](https://docs.docker.com/compose/compose-file/)

### Development

There are 2 kinds of development that can be used for the relayer: Docker and non-Docker.

It is recommended (not required) that users install [docker](https://www.docker.com/)

##### Docker

```
docker-compose up -d
docker-compose logs node --follow
```

##### Non-Docker (Deprecated: You need to have LND running and bunch of other stuff that is defined in the docker-compose file)

You will need to open up 2 terminal windows.

- In the first window, run the command `npm run dev`. This will start a gRPC server that will update as you change code
- In additional windows, run any of the `test-client-*` files which perform

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

### Additional Notes

- All amounts come into the application as a string that represented a 64 bit integer. In order to support this in JS (js support is weird for 64 bit numbers) we use BigInteger AND mongoose long (64 type)

### Troubleshooting

After installing mongodb, you need to start the service on mac by using the command `brew services start mongodb`
