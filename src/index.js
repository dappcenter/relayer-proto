/**
 * Kinesis Relayer
 * Relay node for cross-chain transactions
 *
 *
 * @author kinesis
 */
const GrpcServer = require('./grpc-server');
const GrpcEventHandler = require('./grpc-event-handler');
const { logger } = require('./utils');


class Relayer {
  constructor(Server, EventHandler) {
    this.logger = logger;
    this.eventHandler = new EventHandler(this.logger);
    this.server = new Server(this.logger, this.eventHandler);

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

module.exports = new Relayer(
  GrpcServer,
  GrpcEventHandler,
);
