/**
 * Given an order ID, trigger the Taker to execute the order
 *
 * @param {Object} call, gRPC unary call
 * @param {Function} cb, callback to respond to the gRPC call
 */

const { status } = require('grpc');

const { Order, Fill } = require('../models');

async function executeOrder(call, cb) {
  const { orderId } = call.request;

  this.logger.info('executeOrder: attempting to execute order', { orderId });

  try {
    const order = await Order.findOne({ orderId });

    if (!order) {
      throw new Order(`No order with ID ${orderId}`);
    }

    // TODO: ensure this user is authorized to trigger execution
    // TODO: add some time checking: make sure not too much time has passed

    if (order.status !== Order.STATUSES.FILLED) {
      throw new Error('Only filled orders can be executed.');
    }

    const fill = await Fill.findOne({ order_id: order._id, status: Fill.STATUSES.ACCEPTED });

    if (!fill) {
      throw new Error('No valid fill to trigger execution of.');
    }

    await this.messenger.set(`execute:${order._id}`, order.payTo);

    return cb(null, {});
  } catch (e) {
    // TODO: filtering client friendly errors from internal errors
    this.logger.error('Invalid Order: Could not process', { error: e.toString() });
    return cb({ message: e.message, code: status.INTERNAL });
  }
}

module.exports = executeOrder;
