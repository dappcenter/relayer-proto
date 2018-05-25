const { GrpcUnaryMethod, GrpcServerStreamingMethod } = require('grpc-methods')
const { loadProto } = require('../utils')
const createOrder = require('./create-order')
const placeOrder = require('./place-order')
const subscribeFill = require('./subscribe-fill')
const executeOrder = require('./execute-order')
const completeOrder = require('./complete-order')
const cancelOrder = require('./cancel-order')

class MakerService {
  constructor (protoPath, { logger, eventHandler, messenger, engine }) {
    this.protoPath = protoPath
    this.proto = loadProto(this.protoPath)
    this.logger = logger

    this.definition = this.proto.MakerService.service
    this.serviceName = 'MakerService'

    const { CreateOrderResponse,
      PlaceOrderResponse,
      SubscribeFillResponse,
      ExecuteOrderResponse,
      CompleteOrderResponse,
      CancelOrderResponse
    } = this.proto

    this.implementation = {
      createOrder: new GrpcUnaryMethod(createOrder, this.messageId('createOrder'), { logger, eventHandler, engine }, { CreateOrderResponse }).register(),
      placeOrder: new GrpcUnaryMethod(placeOrder, this.messageId('placeOrder'), { logger, eventHandler }, { PlaceOrderResponse }).register(),
      subscribeFill: new GrpcServerStreamingMethod(subscribeFill, this.messageId('subscribeFill'), { logger, eventHandler, messenger }, { SubscribeFillResponse }).register(),
      executeOrder: new GrpcUnaryMethod(executeOrder, this.messageId('executeOrder'), { logger, eventHandler, messenger }, { ExecuteOrderResponse }).register(),
      completeOrder: new GrpcUnaryMethod(completeOrder, this.messageId('completeOrder'), { logger, eventHandler }, { CompleteOrderResponse }).register(),
      cancelOrder: new GrpcUnaryMethod(cancelOrder, this.messageId('cancelOrder'), { logger, eventHandler }, { CancelOrderResponse }).register()
    }
  }

  messageId (methodName) {
    return `[${this.serviceName}:${methodName}]`
  }
}

module.exports = MakerService
