const grpc = require('grpc')

const { loadProto, addImplementations } = require('./grpc-utils')
const maker = require('./maker')
const taker = require('./taker')
const paymentNetwork = require('./payment-network')
const orderbook = require('./orderbook')
const health = require('./health')

const DEFAULT_GRPC_HOST = '0.0.0.0:28492'
const RELAYER_PROTO_PATH = '../proto/relayer.proto'

/**
 * Kinesis Relayer
 * Relay node for cross-chain transactions
 *
 * @author kinesis
 */
class Relayer {
  /**
   * Contructs a relayer (starting a grpc server and initializing all services)
   *
   * @param {GrpcServer} Server
   * @param {EventEmitter} EventHandler
   * @param {Engine} kinesis engine
   * @param {MessageBox} messenger
   * @param {Publisher} publisher
   */
  constructor (EventHandler, Engine, Messenger, Publisher, logger, connectDb) {
    this.db = connectDb()
    this.logger = logger
    this.eventHandler = new EventHandler()
    this.engine = new Engine()
    this.messenger = new Messenger()
    this.marketEventPublisher = new Publisher(this.eventHandler)

    this.host = process.env.RELAYER_GRPC_HOST || DEFAULT_GRPC_HOST

    this.protoPath = require.resolve(RELAYER_PROTO_PATH)
    this.proto = loadProto(this.protoPath)

    this.maker = this.proto.Maker.service
    this.taker = this.proto.Taker.service
    this.orderbook = this.proto.OrderBook.service
    this.paymentNetwork = this.proto.PaymentNetwork.service
    this.health = this.proto.Health.service

    this.server = new grpc.Server()
    this.server.addService(this.maker, addImplementations(this, maker))
    this.server.addService(this.taker, addImplementations(this, taker))
    this.server.addService(this.paymentNetwork, addImplementations(this, paymentNetwork))
    this.server.addService(this.orderbook, addImplementations(this, orderbook))
    this.server.addService(this.health, addImplementations(this, health)


    try {
      this.listen()
    } catch (e) {
      this.logger.error('Error occured while constructing Relayer', { error: e.toString() })
      throw (e)
    }
  }

  /**
   * Binds a grpc server to a specified host.
   *
   * @see process.env.RELAYER_GRPC_HOST
   * @see GrpcServer
   * @returns {void}
   */
  listen () {
    this.server.bind(this.host, grpc.ServerCredentials.createInsecure())
    this.server.start()
    this.logger.info('gRPC server started', { host: this.host })
  }
}

module.exports = Relayer
