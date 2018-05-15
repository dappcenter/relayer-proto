const GrpcMethod = require('./grpc-method')

/**
 * @class Creates a wrapper for Grpc Unary method
 * @extends {GrpcMethod}
 */
class GrpcUnaryMethod extends GrpcMethod {
  /**
   * Execute a unary method and return a response to the client
   *
   * @param  {grpc~ServerUnaryCall}
   * @param  {grpc.Server~sendUnaryData}
   * @return {void}
   */
  async exec (call, sendUnaryData) {
    try {
      this.logRequestStart()

      const { method, logger, requestOptions } = this

      const request = {
        params: call.request,
        logger,
        ...requestOptions
      }

      this.logRequestParams(request.params)

      const response = await method(request, this.responses)

      this.logResponse(response)

      // sendUnaryData expects a callback-like signature, so we leave the first parameter null in the success case
      return sendUnaryData(null, response, this.metadata())
    } catch (err) {
      this.logError(err)

      // sendUnaryData expects a callback-like signature, so we put the error in the first parameter
      return sendUnaryData(this.grpcError(err), null, this.metadata())
    } finally {
      this.logRequestEnd()
    }
  }
}

module.exports = GrpcUnaryMethod
