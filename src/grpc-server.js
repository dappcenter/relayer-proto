const grpc = require('grpc');

const { maker, taker, subscribeOrders } = require('./streams');
const { getOrders } = require('./actions');

const GRPC_HOST = process.env.GRPC_HOST || '0.0.0.0';
const GRPC_PORT = process.env.GRPC_PORT || '50078';
const PROTO_PATH = require.resolve('relayer-proto');
const PROTO_GRPC_TYPE = 'proto';
const PROTO_GRPC_OPTIONS = {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true,
};

/**
 * Abstract class for a grpc server
 *
 * @author kinesis
 */
class GrpcServer {
  constructor(logger, eventHandler) {
    this.logger = logger;
    this.eventHandler = eventHandler;
    this.server = new grpc.Server();
    this.proto = grpc.load(PROTO_PATH, PROTO_GRPC_TYPE, PROTO_GRPC_OPTIONS);
    this.service = this.proto.RelayerClient.service;

    this.server.addService(this.service, {
      maker: maker.bind(this),
      taker: taker.bind(this),
      subscribeOrders: subscribeOrders.bind(this),
      getOrders: getOrders.bind(this),
    });
  }

  /**
   * Binds a given port/host to our grpc server
   *
   * @param {String} host
   * @param {String} port
   * @returns {void}
   */
  listen(host = GRPC_HOST, port = GRPC_PORT) {
    this.server.bind(`${host}:${port}`, grpc.ServerCredentials.createInsecure());
    this.server.start();
    this.logger.info('gRPC server started', { host, port });
  }
}

module.exports = GrpcServer;
