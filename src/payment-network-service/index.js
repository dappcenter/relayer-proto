const { GrpcUnaryMethod } = require('grpc-methods')
const { loadProto } = require('../utils')
const getPublicKey = require('./get-public-key')

class PaymentNetworkService {
  constructor (protoPath, { logger, engine }) {
    this.protoPath = protoPath
    this.proto = loadProto(this.protoPath)
    this.logger = logger

    this.serviceName = 'PaymentNetworkService'
    this.definition = this.proto.PaymentNetworkService.service

    const { GetPublicKeyResponse } = this.proto

    this.implementation = {
      getPublicKey: new GrpcUnaryMethod(getPublicKey, this.messageId('getPublicKey'), { logger, engine }, { GetPublicKeyResponse }).register()
    }
  }

  messageId (methodName) {
    return `[${this.serviceName}:${methodName}]`
  }
}

module.exports = PaymentNetworkService
