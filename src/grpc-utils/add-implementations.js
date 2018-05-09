const grpc = require('grpc')
const { PublicError } = require('../errors')

/**
 * Generates a prefix for all external logs for a grpc implementation
 *
 * @return {String}
 */
function prefix () {
  return `[Relayer] - [${new Date()}]:`
}

/**
 * Generates grpc meta data for a request that includes a relayer identifier and
 * timestamp
 *
 * @return {grpc#Metadata}
 */
function metadata () {
  const meta = new grpc.Metadata()
  meta.add('service', 'Relayer')
  meta.add('timestamp', (new Date()).toString())
  return meta
}

/**
 * Creates a Grpc Implementation for a specified method name
 *
 * @param {Relayer} relayer
 * @param {Object} implementations key value of functions
 * @param {String} method method name
 * @return {async Function<call, res>}
 */
function createImplementation (relayer, fn, methodName) {
  return async (call, res) => {
    try {
      const { request } = call

      // TODO: Add a request ID to these logs
      relayer.logger.info(`Request received: ${methodName}`)
      relayer.logger.debug(`Request made with payload: ${methodName}`, request)

      const response = await fn.call(relayer, request, call)

      return res(null, response, metadata())
    } catch (err) {
      // If an exception is called in an implementation that is NOT manually handled,
      // we will default the message sent to the client. This can be overwritten by
      // throwing a custom error of type `PublicError`
      let message = `Call terminated before completion`

      if (err instanceof PublicError) {
        message = err.message
      }

      relayer.logger.error(err.stack)
      return res({ code: grpc.status.INTERNAL, message: `${prefix()} ${methodName} ${message}` }, null, metadata())
    } finally {
      relayer.logger.info(`Request completed: ${methodName}`)
    }
  }
}

/**
 * Given an Object of functions (module), we return a grpc implementation
 * that binds the specified relayer
 *
 * @param {GrpcServer} relayer
 * @param {Object} implementations key value of functions for a grpc service
 * @return {Object} grpc implementations
 */
function addImplementations (relayer, implementations = {}) {
  return Object.entries(implementations).reduce((acc, [methodName, fn]) => {
    acc[methodName] = createImplementation(relayer, fn, methodName)
    return acc
  }, {})
}

module.exports = addImplementations
