const STATUS_OK = 'OK'
/**
 * Checks that the relayer is up and running
 *
 * @param {GrpcUnaryMethod~request} request - request object
 * @param {Object} responses
 * @param {function} responses.HealthCheckResponse - constructor for HealthCheckResponse messages
 * @return {responses.HealthCheckResponse}
 */
async function check (request, { HealthCheckResponse }) {
  return new HealthCheckResponse({
    status: STATUS_OK
  })
}

module.exports = check
