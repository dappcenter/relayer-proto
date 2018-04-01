/**
 * Kinesis Relayer
 * Relay node for cross-chain transactions
 *
 *
 * @author kinesis
 */
const winston = require('winston');

const { server:GrpcServer, services:GrpcServices } = require('./grpc');
const { logger } = require('./utils');

const RelayerImplementations = require('./relayer-implementations');
const RelayerEventHandler = require('./relayer-event-handler');

// We support multiple services, but for now we only have 1 proto that we
// care about
const { relayer: GrpcService } = GrpcServices;

class Relayer {
  constructor(server, service, implementations, eventHandler, logger) {
    this.logger = logger;
    this.server = new server(this.logger);
    this.service = service;
    this.implementations = implementations;
    this.eventHandler = new eventHandler(this.logger);

    try {
      this.initializeImplementations();
      this.startServer();
    } catch (e) {
      this.logger.error('Error occured while constructing Relayer', { error: e.toString() });
      throw(e);
    }
  }

  /**
   * Initializes implementations for a given service
   *
   * @returns {void}
   */
  initializeImplementations() {
    const { name, service } = this.service;
    const implementations = new this.implementations(name, this.logger, this.eventHandler);
    this.server.addService(name, service, implementations.export());
  }

  /**
   * Starts a gRPC server
   *
   * @returns {void}
   */
  startServer() {
    this.server.listen();
  }
}

module.exports = new Relayer(
  GrpcServer,
  GrpcService,
  RelayerImplementations,
  RelayerEventHandler,
  logger
);
