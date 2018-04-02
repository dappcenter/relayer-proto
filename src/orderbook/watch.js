const BigNumber = require('bignumber.js');

async function watch(call) {
  this.eventHandler.on('order:created', (order) => {
    call.write({
      orderId: order.id,
      baseSymbol: order.baseSymbol,
      counterSymbol: order.counterSymbol,
      status: order.status,
      fillAmount: new BigNumber(0).toFixed(0),
    });
  });

  this.eventHandler.on('order:cancelled', (order) => {
    call.write({
      orderId: order.id,
      baseSymbol: order.baseSymbol,
      counterSymbol: order.counterSymbol,
      status: order.status,
      fillAmount: new BigNumber(0).toFixed(0),
    });
  });
}

module.exports = watch;
