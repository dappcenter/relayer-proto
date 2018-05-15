const grpc = require('grpc')
const { PublicError } = require('../errors')

/**
 * Abstract class for creating Grpc method wrappers
 */
class GrpcMethod {
  /**
   * @name method
   * @function
   * @param {Object} request Request object constructed by a GrpcMethod wrapper
   * @param {Object} responses Response constructors to pass to the method
   */

  /**
   * Creates a Grpc method wrapper
   *
   * @param  {GrpcMethod~method} method Method to be wrapped and called during execution
   * @param  {string} messageId Identifier for log messages and public messages. Typically `[${serviceName}:${methodName}]`
   * @param  {Object} options
   * @param  {Object} options.logger Logger to be used by the method
   * @param  {*} options.* additional parameters to be included in each request object
   * @param  {Object} responses Response constructors to pass to the method
   * @return {GrpcMethod}
   */
  constructor (method, messageId = '', { logger = console, ...requestOptions } = {}, responses = {}) {
    // Method definition
    this.method = method

    // Logger helper
    this.messageId = messageId

    // Options to include in every request object
    this.logger = logger
    this.requestOptions = requestOptions

    // Response constructors
    this.responses = responses
  }

  /**
   * Abstract function to be implemented by subclasses for method execution
   *
   * @param  {grpc.internal~Call}
   * @return {void}
   */
  exec (call) {
    throw new Error('Unimplemented Abstract Method')
  }

  /**
   * Create a function that can be used as a service implementation in grpc.Server#addService
   *
   * @return {function} GrpcMethod#exec bound to the instance context
   */
  register () {
    return this.exec.bind(this)
  }

  /**
   * Generates grpc meta data for a request that includes a relayer identifier and
   * timestamp
   *
   * @return {grpc#Metadata}
   */
  metadata () {
    const meta = new grpc.Metadata()
    meta.add('timestamp', (new Date()).toString())
    return meta
  }

  /**
   * @typedef {Object} GrpcError
   * @property {number} code Grpc Status code for the error
   * @property {string} message Message to be delivered to the client
   */

  /**
   * Format errors for consumption by external grpc clients
   *
   * @param  {error} err Error to be formatted for public consumption
   * @return {GrpcError}
   */
  grpcError (err) {
    let message = `Call terminated before completion`

    if (err instanceof PublicError) {
      message = err.message
    }

    return {
      code: grpc.status.INTERNAL,
      message: `${this.messageId} ${message}`
    }
  }

  /**
   * Log the start of a request
   *
   * @return {void}
   */
  logRequestStart () {
    this.logger.info(`Request received: ${this.messageId}`)
  }

  /**
   * Log the parameters of a request
   *
   * @param  {Object} parameters of the request
   * @return {void}
   */
  logRequestParams (params) {
    this.logger.debug(`Request made with payload: ${this.messageId}`, params)
  }

  /**
   * Log client cancellation of a request
   *
   * @return {void}
   */
  logRequestCancel () {
    this.logger.info(`Request cancelled by client: ${this.messageId}`)
  }

  /**
   * Log completion (successful or otherwise) of a request
   *
   * @return {void}
   */
  logRequestEnd () {
    this.logger.info(`Request completed: ${this.messageId}`)
  }

  /**
   * Log data that will be sent to the client
   *
   * @param  {Object} data
   * @return {void}
   */
  logResponse (data) {
    this.logger.info(`Response generated: ${this.messageId}`)
    this.logger.debug(`Responding with payload: ${this.messageId}`, data)
  }

  /**
   * Log errors generated while handling request
   *
   * @param  {error} err
   * @return {void}
   */
  logError (err) {
    this.logger.error(`Error while handling request: ${this.messageId}`)
    this.logger.error(err.stack)
  }
}

module.exports = GrpcMethod
