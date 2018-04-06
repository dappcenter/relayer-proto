/**
 * Given an order id, start the swap
 *
 * TODO: check that preimage matches swap hash
 */

const { Order } = require('../models');

async function completeOrder(orderId) {
  const order = new Order({ id: orderId });

  // emit this here or after everything is all done?
  // TODO: Figure out if we emit this here, or we wait until the order is actually fulfilled.
  //   At the point of this code, we would be in-process of fulfilling the order, but there
  //   is a time delay to when the transactions will actually make it onto the ledger
  this.eventHandler.emit('order:completed', order);
  return ['FILLED', order];
}

module.exports = completeOrder;
