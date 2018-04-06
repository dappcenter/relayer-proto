# Kinesis Relayer

![Kinesis Exchange](https://kines.is/logo.png)

[![CircleCI](https://circleci.com/gh/kinesis-exchange/relayer/tree/master.svg?style=svg&circle-token=e939c1cbff879d7a083bea569a22d0ed8691e662)](https://circleci.com/gh/kinesis-exchange/relayer/tree/master)

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

You will need to install [docker](https://www.docker.com/) for our setup.

##### Docker

```
docker-compose up -d
docker-compose logs node --follow
```

##### Ports that are exposed to the host (through docker)

```
localhost:50078 # Relayer
localhost:27017 # MongoDB
```

### Additional Notes

- All amounts come into the application as a string that represented a 64 bit integer. In order to support this in JS (js support is weird for 64 bit numbers) we use BigInteger AND mongoose long (64 type)

### Troubleshooting

After installing mongodb, you need to start the service on mac by using the command `brew services start mongodb`
