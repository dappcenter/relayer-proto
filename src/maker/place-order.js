/**
 * Given an orderId and rqeuest, place an order in the relayer
 *
 * This function returns an invoice for a fee and returns an invoice for the order
 * 1. Send
 * 2. Invoices
 *   - deposit
 *   - fee
 *
 * TODO: Think through the formatting for an order request
 * TODO: Figure out how we want the client to know if the payload is bad
 */

const { status } = require('grpc');

const { Order } = require('../models');

async function placeOrder(call, cb) {
  const rawOrder = call.request;

  // From the request, parse the raw order
  // Check if the orderId is already present in the db
  // if the order isn't present then place the order
  // Additionally, at this point we could probably create a uuid
  const order = new Order(rawOrder);

  if (order.valid() === false) {
    this.logger.error('Invalid Order: Could not process');
    return cb({ message: 'Invalid Order: Could not process', code: status.INVALID_ARGUMENT });
  }

  this.eventHandler.emit('order:created', order);
  this.logger.info('order:created', { orderId: order.id });

  return cb(null, { ownerUuid: order.makerId, orderId: order.id });
}

module.exports = placeOrder;
