# Kinesis Relayer

<img src="https://kines.is/logo.png" alt="Kinesis Exchange" width="550">

[![CircleCI](https://circleci.com/gh/kinesis-exchange/relayer/tree/master.svg?style=svg&circle-token=e939c1cbff879d7a083bea569a22d0ed8691e662)](https://circleci.com/gh/kinesis-exchange/relayer/tree/master)

### Before you begin

You will need to install [docker](https://www.docker.com/) for our setup.

Install NVM and run `nvm install 8` to pick up the latest LTS version of node (we will be upgrading to 10 in the future)

After nvm is installed, use `nvm use` to switch to the current node version for this project.

#### Getting started

Install dependencies and build the project w/ `npm run build`

Then run `docker-compose up -d` to start the relayer containers.

The relayer uses a convention called `Engines` which provides functionality to different implementations of the lightning network.

We use the [JavaScript Standard Style](https://standardjs.com/) for our project. Make sure to download a plugin for your prefered editor.

NOTE: Docker will try to bind to ports 10111/27017/28492 on your host/local machine. These are ports for lnd/mongo/relayer respectively.

NOTE: Mongo port is exposed so you can attach a GUI to it like [Mongo Compass Community](https://www.mongodb.com/download-center#compass)

### Commands

- To view logs you can use `docker-compose logs --follow <container_name>` or `docker-compose logs -f <container_name>`
- To run tests, use `npm test`
- To rebuild gRPC, use `npm run build`
- To start all relayer containers `docker-compose up -d`
- To stop all relayer containers `docker-compose down`
- To create a channel to the broker `npm run create-channel`
- To fund the relayer on simnet `npm run fund`

##### Ports that are exposed to the host (through docker)

```
localhost:28492 # Relayer rpc
localhost:10111 # Relayer LND
localhost:27017 # MongoDB
```

### Terminology

- Server - gRPC server
- Implementations - action handlers for events provided by gRPC proto
- Service - gRPC service
- Relayer Events - any action that is triggered by implementations
- Relayer Subscriptions - client hooks for actions emitted by the relayer


### Funding the relayer

Make sure you have pulled the latest relayer code, built the project w/ `npm run build` and rebuilt all images with `docker-compose build --force-rm`. You can then run `npm run fund`.

### Opening a channel w/ the broker

After you've received a host address and public key from the broker, you can run `npm run create-channel`. You will be prompted in terminal to supply both the address and key.

### Additional Notes

- [gRPC NodeJS](https://grpc.io/grpc/node/grpc.Server.html#addService)
- [NodeJS Directory Structure Best Practices](https://blog.risingstack.com/node-hero-node-js-project-structure-tutorial/)
- [gRPC basic - Bidirectional Streaming](https://grpc.io/docs/guides/concepts.html#bidirectional-streaming-rpc)
- [LND w/ NodeJS](https://github.com/lightningnetwork/lnd/blob/master/docs/grpc/javascript.md)
- [LND API Reference](http://api.lightning.community/)
- [Big.js so we can support int64](https://github.com/MikeMcl/big.js/)
- [Adding methods to mongoose schemas](http://mongoosejs.com/docs/2.7.x/docs/methods-statics.html)
- [Mongo DB Compass](https://www.mongodb.com/download-center#compass)
- All amounts come into the application as a string that represented a 64 bit integer. In order to support this in JS (js support is weird for 64 bit numbers) we use Big AND mongoose long (64 type)

### Troubleshooting

Using `GRPC_VERBOSITY=DEBUG` and `GRPC_TRACE=all` on the relayer is our best friend
