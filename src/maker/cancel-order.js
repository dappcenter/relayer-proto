/**
 * Given an order ID, cancel the specific order
 *
 * TODO: Actually implement cancelling of orders w/ data store
 * @param {String} orderId
 * @param {Object} request
 * @returns {Array<STATUS, Object>} response
 */

const { status } = require('grpc');

const { Order } = require('../models');

async function cancelOrder(call, cb) {
  const { orderId } = call.request;

  this.logger.info('cancelOrder: attempting to cancel order', { orderId });

  try {
    const order = Order.findOne({ orderId });

    // TODO: ensure this user is authorized to cancel this order

    await order.cancel();

    this.eventHandler.emit('order:cancelled', order);

    return cb(null, { orderId: order.id });
  } catch (e) {
    this.logger.error('Invalid Order: Could not process', { error: e.toString() });
    return cb({ message: e.message, code: status.INTERNAL });
  }
}

module.exports = cancelOrder;
