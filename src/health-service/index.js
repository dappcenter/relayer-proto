const check = require('./check')
const { GrpcUnaryMethod, loadProto } = require('grpc-methods')

/**
 * @class grpc service for use in grpc.Server#addService
 */
class HealthService {
  /**
   * @param  {string} protoPath path to the proto file that defines this service
   * @param  {Object} serviceOptions
   * @param  {Object} serviceOptions.logger Logger to be used by the service and its methods
   * @return {HealthService}
   */
  constructor (protoPath, { logger }) {
    this.serviceName = 'Health'

    this.protoPath = protoPath
    this.proto = loadProto(this.protoPath)

    this.logger = logger

    this.definition = this.proto.Health.service

    const { HealthCheckResponse } = this.proto

    this.implementation = {
      check: new GrpcUnaryMethod(check, this.messageId('check'), { logger }, { HealthCheckResponse }).register()
    }
  }

  messageId (methodName) {
    return `[${this.serviceName}:${methodName}]`
  }
}

module.exports = HealthService
