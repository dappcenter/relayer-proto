/**
 * Given an order ID, cancel the specific order
 *
 * @param {Object} call, gRPC unary call
 * @param {Function} cb, callback to respond to the gRPC call
 */

const { status } = require('grpc')

const { Order } = require('../models')

async function cancelOrder (call, cb) {
  const { orderId } = call.request

  this.logger.info('cancelOrder: attempting to cancel order', { orderId })

  try {
    const order = await Order.findOne({ orderId })

    // TODO: ensure this user is authorized to cancel this order

    await order.cancel()

    this.eventHandler.emit('order:cancelled', order)

    return cb(null, {})
  } catch (e) {
    // TODO: filtering client friendly errors from internal errors
    this.logger.error('Invalid Order: Could not process', { error: e.toString() })
    // eslint-disable-next-line
    return cb({ message: e.message, code: status.INTERNAL })
  }
}

module.exports = cancelOrder
