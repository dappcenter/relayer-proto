const { Order, Fill, Invoice, DepositInvoice, DepositRefundInvoice } = require('../models')
const { PublicError, messages } = require('../errors')
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
async function completeOrder ({ params, logger, eventHandler, engine }) {
  const { orderId, swapPreimage } = params

  const order = await Order.findOne({ orderId })
  // TODO: ensure this user is authorized to ccomplete this order

  if (!order) {
    throw new Error(`No order found with orderId: ${orderId}.`)
  }

  if (order.status !== Order.STATUSES.FILLED) {
    throw new Error(`Cannot complete order ${order.orderId} in ${order.status} status.`)
  }

  const fill = await Fill.findOne({ order_id: order._id, status: Fill.STATUSES.ACCEPTED })

  if (!fill) {
    throw new Error(`No accepted fill found for order ${order.orderId}.`)
  }

  if (!fill.matchesHash(swapPreimage)) {
    throw new PublicError(`Hash does not match preimage for Order ${order.orderId}.`)
  }

  const orderDepositInvoice = await DepositInvoice.findOne({ foreignId: order._id })
  if (!orderDepositInvoice) {
    logger.error('Deposit invoice could not be found for order', { orderId, orderDepositInvoice })
    throw new PublicError(`Cound not find DepositInvoice for ${orderId}`)
  }

  const orderDepositRefundInvoice = await DepositRefundInvoice.findOne({
    foreignId: order._id,
    foreignType: Invoice.FOREIGN_TYPES.ORDER,
    type: Invoice.TYPES.OUTGOING,
    purpose: Invoice.PURPOSES.DEPOSIT
  })

  if (!orderDepositRefundInvoice) {
    logger.error('No refund invoice found for order', { orderId: order.orderId })
    throw new PublicError(`Cound not find DepositRefundInvoice for ${orderId}`)
  }

  const orderDepositInvoicePaid = await engine.isInvoicePaid(orderDepositInvoice.paymentRequest)
  if (!orderDepositInvoicePaid) throw new Error(`Deposit Invoice for Order ${orderId} has not been paid.`)

  const [depositValue, depositRefundValue] = await Promise.all([
    engine.getInvoiceValue(orderDepositInvoice.paymentRequest),
    engine.getInvoiceValue(orderDepositRefundInvoice.paymentRequest)
  ])

  if (depositValue !== depositRefundValue) {
    logger.error('Deposit invoice refund amount does not equal deposit invoice amount', { orderId: order.orderId })
    throw new PublicError(messages.DEPOSIT_VALUES_UNEQUAL(order.orderId))
  }

  if (!orderDepositRefundInvoice.paid()) {
    const depositPreimage = await engine.payInvoice(orderDepositRefundInvoice.paymentRequest)
    await orderDepositRefundInvoice.markAsPaid(depositPreimage)
  }

  const fillDepositInvoice = await DepositInvoice.findOne({ foreignId: fill._id })
  if (!fillDepositInvoice) {
    logger.error('Deposit invoice could not be found for fill', { fillId: fill.fillId, fillDepositInvoice })
    throw new PublicError(`Cound not find DepositInvoice for ${fill.fillId}`)
  }

  const fillDepositRefundInvoice = await DepositRefundInvoice.findOne({
    foreignId: fill._id,
    foreignType: Invoice.FOREIGN_TYPES.FILL,
    type: Invoice.TYPES.OUTGOING,
    purpose: Invoice.PURPOSES.DEPOSIT
  })

  if (!fillDepositRefundInvoice) {
    logger.error('No refund invoice found for fill on order', { orderId: order.orderId })
  }

  const fillDepositInvoicePaid = await engine.isInvoicePaid(fillDepositInvoice.paymentRequest)
  if (!fillDepositInvoicePaid) throw new Error(`Deposit Invoice for Fill ${fill.fillId} has not been paid.`)

  const [fillDepositInvoiceValue, fillDepositRefundInvoiceValue] = await Promise.all([
    engine.getInvoiceValue(fillDepositInvoice.paymentRequest),
    engine.getInvoiceValue(fillDepositRefundInvoice.paymentRequest)
  ])

  if (fillDepositInvoiceValue !== fillDepositRefundInvoiceValue) {
    logger.error('Deposit invoice refund amount does not equal deposit invoice amount', { fillId: fill.fillId })
    throw new PublicError(messages.DEPOSIT_VALUES_UNEQUAL(fill.fillId))
  }

  if (!fillDepositRefundInvoice.paid()) {
    const depositPreimage = await engine.payInvoice(fillDepositRefundInvoice.paymentRequest)
    await fillDepositRefundInvoice.markAsPaid(depositPreimage)
  }

  await order.complete()

  eventHandler.emit('order:completed', order)

  return {}
}

module.exports = completeOrder
