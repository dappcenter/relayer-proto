/**
 * Stream of current state of order book and then will give you updates to the
 * order book.
 *
 * Orders
 * .where(baseSymbol = baseSymbol)
 * .where(counterSymbol = counterSymbol)
 * .series('SELECT * FROM Orders WHERE orderId = orderId LIMIT 1)
 * .where('status === 'PLACED' OR status === 'FILLING')
 */

const bigInt = require('big-integer');

async function watchMarket(call) {
  const { baseSymbol, counterSymbol } = call.request;

  this.logger.info('getOrders: Grabbing all orders with symbols', { baseSymbol, counterSymbol });

  this.eventHandler.on('order:placed', (order) => {
    if (order.baseSymbol === baseSymbol && order.counterSymbol === counterSymbol) {
      call.write({
        orderId: order.id,
        status: order.status,
        baseSymbol: order.baseSymbol,
        counterSymbol: order.counterSymbol,
        fillAmount: bigInt(0),
      });
    }
  });

  // this.eventHandler.on('order:cancelled', (order) => {
  // this.eventHandler.on('order:filled', (orderId, order) => {
}

module.exports = watchMarket;
