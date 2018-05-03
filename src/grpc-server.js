const grpc = require('grpc')
const path = require('path')
const fs = require('fs')

const GrpcAction = require('./grpc-action')
const GrpcMarketAction = require('./grpc-market-action')
const { createOrder, placeOrder, cancelOrder, subscribeFill, executeOrder, completeOrder } = require('./maker')
const { createFill, fillOrder, subscribeExecute } = require('./taker')
const { watchMarket, MarketEventPublisher } = require('./orderbook')
const { getPublicKey } = require('./payment-network')
const { MessageBox } = require('./messaging')
const { check } = require('./health')

const RELAYER_GRPC_HOST = process.env.RELAYER_GRPC_HOST || '0.0.0.0:28492'

/**
 * Abstract class for a grpc server
 *
 * @author kinesis
 */
class GrpcServer {
  constructor (logger, eventHandler, engine) {
    this.protoPath = path.resolve('./proto/relayer.proto')
    this.protoFileType = 'proto'
    this.protoOptions = {
      convertFieldsToCamelCase: true,
      binaryAsBase64: true,
      longsAsStrings: true
    }

    if (!fs.existsSync(this.protoPath)) {
      throw new Error(`relayer.proto does not exist at ${this.protoPath}. please run 'npm run build'`)
    }

    this.engine = engine
    this.logger = logger
    this.eventHandler = eventHandler
    this.marketEventPublisher = new MarketEventPublisher(this.eventHandler)
    this.messenger = new MessageBox()
    this.server = new grpc.Server()
    this.proto = grpc.load(this.protoPath, this.protoFileType, this.protoOptions)

    this.makerService = this.proto.Maker.service
    this.takerService = this.proto.Taker.service
    this.orderBookService = this.proto.OrderBook.service
    this.paymentNetworkService = this.proto.PaymentNetwork.service
    this.healthService = this.proto.Health.service
    this.action = new GrpcAction(this.eventHandler, this.messenger, this.logger, this.engine)
    this.marketAction = new GrpcMarketAction(this.marketEventPublisher, this.eventHandler, this.messenger, this.logger, this.engine)

    this.server.addService(this.makerService, {
      createOrder: createOrder.bind(this.action),
      placeOrder: placeOrder.bind(this.action),
      cancelOrder: cancelOrder.bind(this.action),
      subscribeFill: subscribeFill.bind(this.action),
      executeOrder: executeOrder.bind(this.action),
      completeOrder: completeOrder.bind(this.action)
    })

    this.server.addService(this.takerService, {
      createFill: createFill.bind(this.action),
      fillOrder: fillOrder.bind(this.action),
      subscribeExecute: subscribeExecute.bind(this.action)
    })

    this.server.addService(this.paymentNetworkService, {
      getPublicKey: getPublicKey.bind(this.action)
    })

    this.server.addService(this.orderBookService, {
      watchMarket: watchMarket.bind(this.marketAction)
    })

    this.server.addService(this.healthService, {
      check: check.bind(this.action)
    })
  }

  /**
   * Binds a given port/host to our grpc server
   *
   * @param {String} host
   * @param {String} port
   * @returns {void}
   */
  listen (host = RELAYER_GRPC_HOST) {
    this.server.bind(host, grpc.ServerCredentials.createInsecure())
    this.server.start()
    this.logger.info('gRPC server started', { host })
  }
}

module.exports = GrpcServer
