const BigNumber = require('bignumber.js');

async function watchMarket(call) {
  const { baseSymbol, counterSymbol } = call.request;

  this.logger.info('getOrders: Grabbing all orders with symbols', { baseSymbol, counterSymbol });

  this.eventHandler.on('order:created', (order) => {
    if (order.baseSymbol === baseSymbol && order.counterSymbol === counterSymbol) {
      call.write({
        orderId: order.id,
        status: order.status,
        baseSymbol: order.baseSymbol,
        counterSymbol: order.counterSymbol,
        fillAmount: new BigNumber(0).toFixed(0),
      });
    }
  });
}

module.exports = watchMarket;
