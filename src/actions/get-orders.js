/**
 * Mixin method to provide functionality for getting all orders on the relayer's
 * order book
 */

const uuidV4 = require('uuid/v4');

const { Order } = require('./models');

async function getOrders(call, cb) {
  const reqId = uuidV4();
  const { baseSymbol, counterSymbol } = call.request;

  this.logger.info('getOrders: Grabbing all orders with symbols', { baseSymbol, counterSymbol, reqId });

  // probably create a fake order here
  // We want to query all orders in the following format
  // Orders
  //   .where(baseSymbol = baseSymbol)
  //   .where(counterSymbol = counterSymbol)
  //   .series('SELECT * FROM Orders WHERE orderId = orderId LIMIT 1)
  //   .where('status === 'PLACED' OR status === 'FILLING')
  //
  // The series part of the query needs to follow this pattern
  // const firstInstance = orders.map( order => order.orderId ).indexOf(order.orderId) === index
  const order = new Order({
    id: uuidV4(),
    baseSymbol: 'BTC',
    counterSymbol: 'LTC',
    baseAmount: '10000',
    counterAmount: '1000000',
    side: 'BID',
    status: 'PLACED',
  });
  const orders = [order.export()];

  this.logger.info('getOrders: Finishing action', { reqId });
  return cb(null, { orderUpdates: orders });
}

module.exports = getOrders;
