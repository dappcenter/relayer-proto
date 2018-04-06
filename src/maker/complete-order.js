/**
 * Given an order ID, complete the order and refund deposits
 *
 * @param {Object} call, gRPC unary call
 * @param {Function} cb, callback to respond to the gRPC call
 *
 * TODO: check that preimage matches swap hash
 */

const { status } = require('grpc');

const { Order, Fill } = require('../models');

async function completeOrder(call, cb) {
  const { orderId, swapPreimage } = call.request;

  this.logger.info('completeOrder: attempting to cancel order', { orderId });

  try {
    const order = await Order.findOne({ orderId });
    // TODO: ensure this user is authorized to ccomplete this order

    if (order.status !== Order.STATUSES.FILLED) {
      throw new Error(`Cannot complete order ${order.orderId} in ${order.status} status.`);
    }

    const fill = await Fill.findOne({ order_id: order._id, status: Fill.STATUSES.ACCEPTED });

    if (!fill) {
      throw new Error(`No accepted fill found for order ${order.orderId}.`);
    }

    const preimage = Buffer.from(swapPreimage, 'base64');

    if (!fill.matchesHash(preimage)) {
      throw new Error(`Hash does not match preimage for Order ${order.orderId}.`);
    }

    await order.complete();

    this.eventHandler.emit('order:completed', order);

    return cb(null, {});
  } catch (e) {
    // TODO: filtering client friendly errors from internal errors
    this.logger.error('Invalid Order: Could not process', { error: e.toString() });
    return cb({ message: e.message, code: status.INTERNAL });
  }
}

module.exports = completeOrder;
