const grpc = require('grpc')

const HealthService = require('./health-service')
const OrderBookService = require('./orderbook-service')
const MakerService = require('./maker-service')
const TakerService = require('./taker-service')
const PaymentNetworkService = require('./payment-network-service')

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

    this.server = new grpc.Server()

    this.protoPath = require.resolve(RELAYER_PROTO_PATH)

    this.healthService = new HealthService(this.protoPath, this)
    this.server.addService(this.healthService.definition, this.healthService.implementation)

    this.orderBookService = new OrderBookService(this.protoPath, this)
    this.server.addService(this.orderBookService.definition, this.orderBookService.implementation)

    this.makerService = new MakerService(this.protoPath, this)
    this.server.addService(this.makerService.definition, this.makerService.implementation)

    this.takerService = new TakerService(this.protoPath, this)
    this.server.addService(this.takerService.definition, this.takerService.implementation)

    this.paymentNetworkService = new PaymentNetworkService(this.protoPath, this)
    this.server.addService(this.paymentNetworkService.definition, this.paymentNetworkService.implementation)

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
