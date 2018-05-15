const { GrpcServerStreamingMethod, loadProto } = require('../grpc-service')
const watchMarket = require('./watch-market')

class OrderBookService {
  constructor (protoPath, { logger, eventHandler, marketEventPublisher }) {
    this.protoPath = protoPath
    this.proto = loadProto(this.protoPath)
    this.logger = logger

    this.definition = this.proto.OrderBook.service
    this.serviceName = 'OrderBook'

    const { WatchMarketResponse } = this.proto

    this.implementation = {
      watchMarket: new GrpcServerStreamingMethod(watchMarket, this.messageId('watchMarket'), { logger, eventHandler, marketEventPublisher }, { WatchMarketResponse }).register()
    }
  }

  messageId (methodName) {
    return `[${this.serviceName}:${methodName}]`
  }
}

module.exports = OrderBookService
