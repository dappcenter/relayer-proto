const STATUS_OK = 'OK'
/**
 * Checks that the relayer is up and running
 *
 * @param {Object} req - request object
 * @param {Grpc#Call} call - grpc call object
 * @return {proto#HealthCheckResponse}
 */
async function check (req, call) {

  return new this.proto.HealthCheckResponse({
    status: STATUS_OK
  })
}

module.exports = check
