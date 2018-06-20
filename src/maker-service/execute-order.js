const { Order, Fill } = require('../models')

/**
 * Given an order ID, trigger the Taker to execute the order
 *
 * @param {GrpcUnaryMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {Object} request.logger - logger for messages about the method
 * @param {MessageBox} request.messenger
 * @return {Object}
 */
async function executeOrder ({ params, logger, messenger }) {
  const { orderId } = params

  const order = await Order.findOne({ orderId })

  if (!order) {
    throw new Error(`No order with ID ${orderId}`)
  }

  // TODO: ensure this user is authorized to trigger execution
  // TODO: add some time checking: make sure not too much time has passed

  if (order.status !== Order.STATUSES.FILLED) {
    throw new Error(`Cannot fill order in ${order.status} status.`)
  }

  const fill = await Fill.findOne({ order_id: order._id, status: Fill.STATUSES.ACCEPTED })

  if (!fill) {
    throw new Error('No valid fill to trigger execution of.')
  }

  await messenger.set(`execute:${order._id}`, order.payTo)

  return {}
}

module.exports = executeOrder
