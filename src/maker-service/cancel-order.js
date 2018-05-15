const { Order } = require('../models')

/**
 * Cancel an order given an ID
 *
 * @param {GrpcUnaryMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {EventEmitter} request.eventHandler - Event bus to put order messages onto
 * @param {Object} responses
 * @param {function} responses.CancelOrderResponse - constructor for CancelOrderResponse messages
 * @return {responses.CancelOrderResponse}
 */
async function cancelOrder ({ params, eventHandler }, { CancelOrderResponse }) {
  const { orderId } = params
  const order = await Order.findOne({ orderId })

  // TODO: ensure this user is authorized to cancel this order
  await order.cancel()

  eventHandler.emit('order:cancelled', order)

  return new CancelOrderResponse({})
}

module.exports = cancelOrder
