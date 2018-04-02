# Kinesis Relayer

#### Getting started

Install NVM and run `nvm install 8` to pick up the latest LTS version of node (we will be upgrading to 10 in the future)

After nvm is installed, use `nvm use` to switch to the current node version for this project.

Additionally, we use MongoDB as our data store. You will need to run `brew install mongodb` and then run the db initialzer script using `npm run db-init`

Install dependencies w/ `npm i` and then build the project with `npm run build`. The former command will initialize the protocol buffers for LND and Relayer as well as run tests against the project to make sure everything is setup properly

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

### Development

There are 2 kinds of development that can be used for the relayer: Docker and non-Docker.

It is recommended (not required) that users install [docker](https://www.docker.com/)

##### Docker

```
docker-compose up -d
docker-compose logs node --follow
```

##### Non-Docker

You will need to open up 2 terminal windows.

- In the first window, run the command `npm run dev`. This will start a gRPC server that will update as you change code
- In additional windows, run any of the `test-client-*` files which perform

### TODOS

- Cancel Orders correctly (trey)
- Fill Orders (Dan)
- Add DB (postgres)
- Add dev util to track dependencies (and when we should update them)
- Add dev util to post test rpc commands
- Add tests for all modules
- Cleanup formatting of comments for all pages
- Setup Test runs and builds w/ Circle CI
- Replace eventemitter w/ servicebus? (or some kind of managed pubsub)
- fix `npm run build` to not fail if logs exist

### Additional Notes

- Always use uuid v4 (this is a random UUID, not the same as time-based)

### Troubleshooting

After installing mongodb, you need to start the service on mac by using the command `brew services start mongodb`
