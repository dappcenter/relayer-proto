const { status } = require('grpc');

const { Order } = require('../models');

/**
 * Given an orderId and refundInvoice, place an order in the relayer. This will
 * make the order actionable to all other users.
 *
 * @param {grpc} call
 * @param {Function<err, message>} cb
 */
async function placeOrder(call, cb) {
  const { orderId, feeRefundInvoice, depositRefundInvoice } = call.request;

  // TODO: Need to validate these steps
  //
  // 1. Given the orderId, we need to check a few things
  //    - make sure that the fees and deposits have been paid
  //    - make sure it even exists
  //    - make sure that it is a valid order (not cancelled or whatever) preferably
  //      by querying mongo for created orders?
  //    - checks if the maker is reachable on Lightning Network on channels
  //    - sufficient to complete swap (depending on fill amount)
  // 2. Create a new order with the refundinvoice in the created status
  // 3. Broadcast to everyone
  //

  const order = new Order({ orderId, feeRefundInvoice });

  if (order.valid() === false) {
    this.logger.error('Invalid Order: Could not process');
    return cb({ message: 'Invalid Order: Could not process', code: status.INVALID_ARGUMENT });
  }

  this.eventHandler.emit('order:placed', order);
  this.logger.info('order:placed', { orderId: order.id });

  return cb(null, { ownerUuid: order.makerId, orderId: order.id });
}

module.exports = placeOrder;
