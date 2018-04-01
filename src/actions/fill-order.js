/**
 * Implements a client to client order fill
 *
 * TODO: this will have to change dramatically when payments get implemented
 * TODO: Need to figure out how to notify the orders recip
 */

const { Order } = require('./models');

/**
 * Fill an order from the specified order id
 *
 * The following steps occur to fill an order:
 * 1. Get an order with some orderId
 * 2. Validate that the order is in a valid state
 * 3. Update order to in-progress
 * 4. Notify the network that an order is pending
 * 5. Notify the receipient of the order that it is pending
 *
 * @param {String} orderId
 * @param {Object} request
 */
async function fillOrder(orderId) {
  const order = new Order({ id: orderId });

  this.eventHandler.emit('order:filled', order);

  return [null, order];
}

module.exports = fillOrder;
