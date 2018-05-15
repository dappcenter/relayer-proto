const { Order, Fill } = require('../models')

/**
 * Given an order ID, trigger the Taker to execute the order
 *
 * @param {GrpcUnaryMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {Object} request.logger - logger for messages about the method
 * @param {MessageBox} request.messenger
 * @param {Object} responses
 * @param {function} responses.ExecuteOrderResponse - constructor for ExecuteOrderResponse messages
 * @return {responses.ExecuteOrderResponse}
 */
async function executeOrder ({ params, logger, messenger }, { ExecuteOrderResponse }) {
  const { orderId } = params

  const order = await Order.findOne({ orderId })

  if (!order) {
    throw new Error(`No order with ID ${orderId}`)
  }

  // TODO: ensure this user is authorized to trigger execution
  // TODO: add some time checking: make sure not too much time has passed

  if (order.status !== Order.STATUSES.FILLED) {
    throw new Error('Only filled orders can be executed.')
  }

  const fill = await Fill.findOne({ order_id: order._id, status: Fill.STATUSES.ACCEPTED })

  if (!fill) {
    throw new Error('No valid fill to trigger execution of.')
  }

  await messenger.set(`execute:${order._id}`, order.payTo)

  return new ExecuteOrderResponse({})
}

module.exports = executeOrder