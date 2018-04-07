/**
 * Given an order ID, open a stream for order exection commands
 *
 * @param {Object} call, gRPC server-streaming call
 */

const { status } = require('grpc');

const { Order } = require('../models');

async function subscribeFill(call) {
  const { orderId } = call.request;

  this.logger.info('subscribeFill: opening stream to listen for order fills', { orderId });

  try {
    const order = await Order.findOne({ orderId });

    if (!order) {
      throw new Error(`No order with ID ${orderId}.`);
    }

    // TODO: ensure this user is authorized to connect to this order's stream
    if (order.status !== Order.STATUSES.PLACED) {
      throw new Error(`Cannot setup a fill listener for order in ${order.status} status.`);
    }

    // TODO: buffering in case of:
    //  1. not connecting fast enough
    //  2. drop and re-connect (will also need to make sure to get rid of old listner)
    // TODO: should we filter this listener down?
    this.eventHandler.on('order:filling', async (emittedOrder, fill) => {
      if (emittedOrder.orderId !== order.orderId) {
        return;
      }

      try {
        await order.fill();
      } catch (e) {
        // TODO: filtering client friendly errors from internal errors
        this.logger.error('Invalid Order: Could not process', { error: e.toString() });
        call.emit({ message: e.message, code: status.INTERNAL });
        call.destroy();
      }

      call.write({
        swapHash: fill.swapHash,
        fillAmount: fill.fillAmount,
      });

      call.end();

      this.eventHandler.emit('order:filled', order);
    });
  } catch (e) {
    // TODO: filtering client friendly errors from internal errors
    this.logger.error('Invalid Order: Could not process', { error: e.toString() });
    call.emit({ message: e.message, code: status.INTERNAL });
    call.destroy();
  }
}

module.exports = subscribeFill;
