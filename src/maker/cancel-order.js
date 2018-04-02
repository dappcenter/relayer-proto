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
  const { makerId, orderId } = call.request;

  this.logger.info('cancelOrder: attempting to cancel order', { orderId, makerId });

  // Get an order w/ a placed status
  // update the order as cancelled
  // emil cancelled event to all subscribers
  // return response
  const order = new Order();

  this.eventHandler.emit('order:cancelled', order);

  const failedToCancel = false;

  if (failedToCancel) {
    this.logger.error('cancelOrder: failed to cancel order', { orderId, makerId });
    return cb({ message: 'Invalid Order: Could not process', code: status.CANCELLED });
  }

  return cb(null, { ownerUuid: order.makerId, orderId: order.id });
}

module.exports = cancelOrder;
