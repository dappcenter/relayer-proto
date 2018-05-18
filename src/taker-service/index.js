const { GrpcUnaryMethod, GrpcServerStreamingMethod } = require('grpc-methods')
const { loadProto } = require('../utils')
const createFill = require('./create-fill')
const fillOrder = require('./fill-order')
const subscribeExecute = require('./subscribe-execute')

class TakerService {
  constructor (protoPath, { logger, eventHandler, messenger, engine }) {
    this.protoPath = protoPath
    this.proto = loadProto(this.protoPath)
    this.logger = logger

    this.serviceName = 'Taker'
    this.definition = this.proto.Taker.service

    const { CreateFillResponse, FillOrderResponse, SubscribeExecuteResponse } = this.proto

    this.implementation = {
      createFill: new GrpcUnaryMethod(createFill, this.messageId('createFill'), { logger, eventHandler, engine }, { CreateFillResponse }).register(),
      fillOrder: new GrpcUnaryMethod(fillOrder, this.messageId('fillOrder'), { logger, eventHandler, messenger }, { FillOrderResponse }).register(),
      subscribeExecute: new GrpcServerStreamingMethod(subscribeExecute, this.messageId('subscribeExecute'), { logger, eventHandler, messenger }, { SubscribeExecuteResponse }).register()
    }
  }

  messageId (methodName) {
    return `[${this.serviceName}:${methodName}]`
  }
}

module.exports = TakerService
