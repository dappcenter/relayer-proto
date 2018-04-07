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
const { LndEngine } = require('./payment-engines');


class Relayer {
  constructor(Server, EventHandler, Engine) {
    this.db = db;
    this.engine = new Engine(this.logger);
    this.logger = logger;
    this.eventHandler = new EventHandler();
    this.server = new Server(this.logger, this.eventHandler, this.engine);

    // This is specific to PM2. When the service is restarted, PM2 will kill
    // the process. This callback will allow us to gracefully shutdown DB and other
    // handlers before the process is restarted
    process.on('SIGINT', function() {
      this.db.stop(function(err) {
        process.exit(err ? 1 : 0);
      });
    });

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


module.exports = new Relayer(GrpcServer, EventEmitter, LndEngine);
