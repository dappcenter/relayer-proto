/**
 * Setup streaming events for all orders
 *
 * TODO: Create some concept of subscriptions instead of dumping them all into this action
 * TODO: How do we close this subscription?
 * @param {gRPC.call} call
 */

async function orderSubscription(call) {
  const { baseSymbol, counterSymbol } = call.request

  this.eventEmitter.on('order:created', (order) => {
    if(order.baseSymbol === baseSymbol && order.counterSymbol == counterSymbol) {
      call.write(order.export());
    }
  });

  this.on('order:cancelled', (orderId, order) => {
    if(order.baseSymbol === baseSymbol && order.counterSymbol == counterSymbol) {
      call.write(order.export());
    }
  });

  this.on('order:filled', (orderId, order) => {
    if(order.baseSymbol === baseSymbol && order.counterSymbol == counterSymbol) {
      call.write(order.export());
    }
  });
}

module.exports = orderSubscription;
