/**
 * Abstract class for a grpc server
 *
 * @author kinesis
 */

const grpc = require('grpc');

const GRPC_HOST = process.env.GRPC_HOST || '0.0.0.0';
const GRPC_PORT = process.env.GRPC_PORT || '50078';

class GrpcServer {
  constructor(logger) {
    this.logger = logger;
    this.server = new grpc.Server();
  }

  /**
   * Binds a given port/host to our grpc server
   *
   * @param {String} host
   * @param {String} port
   * @returns {null}
   */
  listen(host = GRPC_HOST, port = GRPC_PORT) {
    this.server.bind(`${host}:${port}`, grpc.ServerCredentials.createInsecure());
    this.server.start();
    this.logger.info('gRPC server started', { host, port });

    return null;
  }

  /**
   * Adds a specificed proto server to our grpc server
   *
   * @param {String} name
   * @param {grpc.proto} service
   * @param {Object<action:handler>} implementations
   * @returns {null}
   */
  addService(name, service, implementations = {}) {
    try {
      this.server.addService(service, implementations);
      this.logger.info('Successfull added implementations', { service: name });
    } catch (e) {
      this.logger.error('Failed to register implementations', { service: name, error: e.toString() });
    } finally {
      return null;
    }
  }
}

module.exports = GrpcServer;
