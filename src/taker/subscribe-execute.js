/**
 * Given an fill ID, open a stream for order exection commands
 *
 * @param {Object} call, gRPC server-streaming call
 */

const { status } = require('grpc');

const { Order, Fill } = require('../models');

async function subscribeExecute(call) {
  const { fillId } = call.request;

  this.logger.info('subscribeFill: opening stream to listen for order executions', { fillId });

  try {
    const fill = await Fill.findOne({ fillId });

    if (!fill) {
      throw new Error(`No fill with ID ${fillId}.`);
    }

    const order = await Order.findOne({ order_id: fill.order_id });

    if (!order) {
      throw new Error(`No order associated with Fill ${fillId}.`);
    }

    // TODO: ensure this user is authorized to connect to this fill's stream
    if (fill.status !== Fill.STATUSES.ACCEPTED) {
      throw new Error(`Cannot setup execution listener for fill in ${fill.status} status.`);
    }

    if (order.status !== Order.STATUSES.FILLED) {
      throw new Error(`Cannot setup execution listener for order in ${order.status} status`);
    }

    const payTo = await this.messenger.get(`execute:${order._id}`);

    call.write({ payTo });

    call.end();
  } catch (e) {
    // TODO: filtering client friendly errors from internal errors
    this.logger.error('Invalid Order: Could not process', { error: e.toString() });
    call.emit({ message: e.message, code: status.INTERNAL });
    call.destroy();
  }
}

module.exports = subscribeExecute;
