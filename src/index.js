/**
 * Kinesis Relayer
 * Relay node for cross-chain transactions
 *
 *
 * @author kinesis
 */
const GrpcServer = require('./grpc-server');
const { EventEmitter } = require('events');
const { logger, db } = require('./utils');


class Relayer {
  constructor(Server, EventHandler) {
    this.db = db;
    this.logger = logger;
    this.eventHandler = new EventHandler();
    this.server = new Server(this.logger, this.eventHandler, this.db);

    try {
      this.startServer();
    } catch (e) {
      this.logger.error('Error occured while constructing Relayer', { error: e.toString() });
      throw (e);
    }
  }

  startServer() {
    this.server.listen();
  }
}

module.exports = new Relayer(GrpcServer, EventEmitter);
