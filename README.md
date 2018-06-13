# Kinesis Relayer

<img src="https://kines.is/logo.png" alt="Kinesis Exchange" width="550">

[![CircleCI](https://circleci.com/gh/kinesis-exchange/relayer/tree/master.svg?style=svg&circle-token=e939c1cbff879d7a083bea569a22d0ed8691e662)](https://circleci.com/gh/kinesis-exchange/relayer/tree/master)

### Before you begin

You will need to install [docker](https://www.docker.com/) for our setup.

Install NVM and run `nvm install 8` to pick up the latest LTS version of node (we will be upgrading to 10 in the future)

After nvm is installed, use `nvm use` to switch to the current node version for this project.

#### Getting started

Install dependencies and build the project w/ `npm i && npm run build`

Then run `docker-compose up -d` to start the relayer containers.

The relayer uses a convention called `Engines` which provides functionality to different implementations of the lightning network.

LND-Engine is currently installed on the relayer. To start the engine, use `npm run lup`. See below for additional commands

NOTE: Docker will try to bind to ports 27017/28492 on your host/local machine. These are ports for mongo/relayer respectively.

NOTE: We only expose the mongo port so you can attach a GUI to it like [Mongo Compass Community](https://www.mongodb.com/download-center#compass)

Additionally, we use the [JavaScript Standard Style](https://standardjs.com/) for our project. Make sure to download a plugin for your prefered editor.

### Commands

- To view logs you can use `docker-compose logs --follow <container_name>` or `docker-compose logs -f <container_name>`
- To run tests, use `npm test`
- To rebuild gRPC, use `npm run build`
- To start all relayer containers `docker-compose up -d`
- To stop all relayer containers `docker-compose down`
- To start lnd-engine `npm run lup`
- To stop lnd-engine `npm run ldown`
- To view status of lnd-engine `npm run lps`

##### Ports that are exposed to the host (through docker)

```
localhost:50078 # Relayer
localhost:27017 # MongoDB
```

### Terminology

- Server - gRPC server
- Implementations - action handlers for events provided by gRPC proto
- Service - gRPC service
- Relayer Events - any action that is triggered by implementations
- Relayer Subscriptions - client hooks for actions emitted by the relayer

### Additional Notes

- All amounts come into the application as a string that represented a 64 bit integer. In order to support this in JS (js support is weird for 64 bit numbers) we use Big.js AND mongoose long (64 type)

### Troubleshooting

Using `GRPC_VERBOSITY=DEBUG` and `GRPC_TRACE=all` on the relayer is our best friend

### Best practices for grpc event handlers

1. use GrpcError classes for throwing errors that should be exposed to the client
2. use `proto.YourResponseType` to identify the correct gprc response for your handler

### Documentation

The following documents are materials that we have followed for developing this application

##### Application

- [gRPC NodeJS](https://grpc.io/grpc/node/grpc.Server.html#addService)
- [NodeJS Directory Structure Best Practices](https://blog.risingstack.com/node-hero-node-js-project-structure-tutorial/)
- [gRPC basic - Bidirectional Streaming](https://grpc.io/docs/guides/concepts.html#bidirectional-streaming-rpc)
- [LND w/ NodeJS](https://github.com/lightningnetwork/lnd/blob/master/docs/grpc/javascript.md)
- [LND API Reference](http://api.lightning.community/)
- [Big.js so we can support int64](https://github.com/MikeMcl/big.js/)
- [Adding methods to mongoose schemas](http://mongoosejs.com/docs/2.7.x/docs/methods-statics.html)
- [Mongo DB Compass](https://www.mongodb.com/download-center#compass)

##### Infrastructure

- [PM2 application declaration](http://pm2.keymetrics.io/docs/usage/application-declaration/)
- [Docker Compose reference](https://docs.docker.com/compose/compose-file/)
- [Creating a lightning network cluster w/ docker](https://github.com/lightningnetwork/lnd/tree/master/docker)
- [Redis Command reference](https://redis.io/commands)
- [Mongoose Documentation](http://mongoosejs.com/docs/)
