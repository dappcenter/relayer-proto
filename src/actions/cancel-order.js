/**
 * Given an order ID, cancel the specific order
 *
 * @param {String} orderId
 * @param {Object} request
 * @returns {Array<STATUS, Object>} response
 */

const { Order } = require('./models');

async function cancelOrder(orderId) {
  // Get an order w/ a placed status
  // update the order as cancelled
  // emil cancelled event to all subscribers
  // return response
  const order = new Order({ id: orderId });
  this.emit('order:cancelled', order);
  return ['CANCELLED', order.export()];
}

module.exports = cancelOrder;
