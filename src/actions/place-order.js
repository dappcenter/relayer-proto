/**
 * Given an orderId and rqeuest, place an order in the relayer
 *
 * TODO: Think through the formatting for an order request
 * TODO: Figure out how we want the client to know if the payload is bad
 */
const { Order } = require('./models');

async function placeOrder(orderId, request) {
  // From the request, parse the raw order
  // Check if the orderId is already present in the db
  // if the order isn't present then place the order
  const { order: rawOrder } = request;
  const order = new Order(rawOrder);

  if (order.valid() === false) {
    this.logger.error('Invalid Order: Could not process');
    return ['REJECTED', {}];
  }

  this.emit('order:created', orderId, order);
  return ['PLACED', {}];
}

module.exports = placeOrder;
