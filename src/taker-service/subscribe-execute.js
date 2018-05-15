const { Order, Fill } = require('../models')

/**
 * Given an fill ID, open a stream for order exection commands
 *
 * @param {GrpcServerStreamingMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {function} request.send - Send a chunk of data to the client
 * @param {Object} responses
 * @param {function} responses.SubscribeExecuteResponse - constructor for SubscribeExecuteResponse messages
 * @return {void}
 */
async function subscribeExecute ({ params, send }, { SubscribeExecuteResponse }) {
  const { fillId } = params

  const fill = await Fill.findOne({ fillId })

  if (!fill) {
    throw new Error(`No fill with ID ${fillId}.`)
  }

  const order = await Order.findOne({ order_id: fill.order_id })

  if (!order) {
    throw new Error(`No order associated with Fill ${fillId}.`)
  }

  // TODO: ensure this user is authorized to connect to this fill's stream
  if (fill.status !== Fill.STATUSES.ACCEPTED) {
    throw new Error(`Cannot setup execution listener for fill in ${fill.status} status.`)
  }

  if (order.status !== Order.STATUSES.FILLED) {
    throw new Error(`Cannot setup execution listener for order in ${order.status} status`)
  }

  const payTo = await this.messenger.get(`execute:${order._id}`)

  send(new SubscribeExecuteResponse({ payTo }))
}

module.exports = subscribeExecute
