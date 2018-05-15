const GrpcMethod = require('./grpc-method')

/**
 * @class Wrapper for Server-streaming Grpc Methods
 * @extends {GrpcMethod}
 */
class GrpcServerStreamingMethod extends GrpcMethod {
  /**
   * Execute a server-streaming method and close the stream when it concludes
   *
   * @param  {grpc~ServerWritableStream} call
   * @return {void}
   */
  async exec (call) {
    try {
      this.logRequestStart()

      const { method, logger, requestOptions } = this

      const request = {
        params: call.request,
        logger: logger,
        send: this.send.bind(this, call),
        ...requestOptions
      }

      this.logRequestParams(request.params)

      call.on('cancelled', () => {
        this.logRequestCancel()
        this.logRequestEnd()
      })

      await method(request, this.responses)

      this.logRequestEnd()
      // TODO: is this the write way to terminate a call?
      call.end()
    } catch (e) {
      this.logError(e)

      // TODO: do we need to set metadata somewhere?
      call.destroy(this.grpcError(e))
    }
  }

  /**
   * Send a chunk of data back to the client
   *
   * @param  {grpc~ServerWritableStream} call the active call to send the data to
   * @param  {Object} data payload to send to the client
   * @return {void}
   */
  send (call, data) {
    this.logResponse(data)
    call.write(data)
  }
}

module.exports = GrpcServerStreamingMethod
