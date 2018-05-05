/**
 * Given an Object of functions (module), we return a grpc implementation
 * that binds the specified context
 *
 * @param {GrpcServer} context
 * @param {Object} key value of functions
 * @return {Object} grpc implementations
 */
function addGrpcImplementation (context, implementations) {
  const implementationNames = Object.keys(implementations)

  return implementationNames.reduce((acc, name) => {
    acc[name] = async (call, res) => {
      // TODO: Add a request ID to these logs
      context.logger.info(`Request received: ${name}`)
      await implementations[name].call(context, call, res)
      context.logger.info(`Request completed: ${name}`)
    }
    return acc
  }, {})
}

module.exports = addGrpcImplementation
