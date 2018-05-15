const { Order, Fill, Invoice } = require('../models')

/**
 * Given an order ID, complete the order and refund deposits
 *
 * @param {GrpcUnaryMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {Object} request.logger - logger for messages about the method
 * @param {EventEmitter} request.eventHandler - Event bus to put order messages onto
 * @param {Object} responses
 * @param {function} responses.CompleteOrderResponse - constructor for CompleteOrderResponse messages
 * @return {responses.CompleteOrderResponse}
 *
 * TODO: check that preimage matches swap hash
 */
async function completeOrder ({ params, logger, eventHandler }, { CompleteOrderResponse }) {
  const { orderId, swapPreimage } = params

  const order = await Order.findOne({ orderId })
  // TODO: ensure this user is authorized to ccomplete this order

  if (order.status !== Order.STATUSES.FILLED) {
    throw new Error(`Cannot complete order ${order.orderId} in ${order.status} status.`)
  }

  const fill = await Fill.findOne({ order_id: order._id, status: Fill.STATUSES.ACCEPTED })

  if (!fill) {
    throw new Error(`No accepted fill found for order ${order.orderId}.`)
  }

  const preimage = Buffer.from(swapPreimage, 'base64')

  if (!fill.matchesHash(preimage)) {
    throw new Error(`Hash does not match preimage for Order ${order.orderId}.`)
  }

  // TODO: parallelize these two?

  // TODO: refund deposits
  const orderDepositRefundInvoice = await Invoice.findOne({
    foreignId: order._id,
    foreignType: Invoice.FOREIGN_TYPES.ORDER,
    type: Invoice.TYPES.OUTGOING,
    purpose: Invoice.PURPOSES.DEPOSIT
  })

  if (!orderDepositRefundInvoice) {
    logger.error('No refund invoice found for order', { orderId: order.orderId })
  } else {
    // await this.engine.sendPayment(orderDepositRefundInvoice.paymentRequest);
  }

  const fillDepositRefundInvoice = await Invoice.findOne({
    foreignId: fill._id,
    foreignType: Invoice.FOREIGN_TYPES.FILL,
    type: Invoice.TYPES.OUTGOING,
    purpose: Invoice.PURPOSES.DEPOSIT
  })

  if (!fillDepositRefundInvoice) {
    logger.error('No refund invoice found for fill on order', { orderId: order.orderId })
  } else {
    // await this.engine.sendPayment(fillDepositRefundInvoice.paymentRequest);
  }

  await order.complete()

  eventHandler.emit('order:completed', order)

  return new CompleteOrderResponse({})
}

module.exports = completeOrder
