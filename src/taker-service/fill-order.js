const { Order, Invoice, Fill } = require('../models')

/**
 * Given an fillId and refundInvoice, fill the order in the relayer. This will
 * award the fill to the user and start the execution process
 *
 * @param {GrpcUnaryMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {Object} request.logger - logger for messages about the method
 * @param {EventEmitter} request.eventHandler - Event bus to put order messages onto
 * @param {Object} responses
 * @param {function} responses.CreateFillResponse - constructor for CreateFillResponse messages
 * @return {responses.CreateFillResponse}
 */
async function fillOrder ({ params, logger, messenger }, { FillOrderResponse }) {
  const { fillId, feeRefundPaymentRequest, depositRefundPaymentRequest } = params

  const fill = await Fill.findOne({ fillId })

  if (!fill) {
    throw new Error(`No fill with ID ${fillId}.`)
  }

  // TODO: validate ownership of the fill

  const order = await Order.findOne({ order_id: fill.order_id })

  if (!order) {
    throw new Error(`No order associated with fill ${fill.fillId}.`)
  }
  const inboundInvoices = await Invoice.find({
    foreignId: fill._id,
    foreignType: Invoice.FOREIGN_TYPES.FILL,
    type: Invoice.TYPES.INCOMING
  })

  if (inboundInvoices.length > 2) {
    // This is basically a corrupt state. Should we cancel the order or something?
    throw new Error(`Too many invoices associated with Fill ${fill.fillId}.`)
  }

  const feeInvoice = inboundInvoices.find(invoice => invoice.purpose === Invoice.PURPOSES.FEE)
  const depositInvoice = inboundInvoices.find(invoice => invoice.purpose === Invoice.PURPOSES.DEPOSIT)

  if (!feeInvoice) {
    throw new Error(`Could not find fee invoice associated with Fill ${fillId}.`)
  }
  if (!depositInvoice) {
    throw new Error(`Could not find deposit invoice associated with Fill ${fillId}.`)
  }

  // TODO: refund their payments if the order is no longer in a good status?
  if (order.status !== Order.STATUSES.PLACED) {
    throw new Error(`Order ${order.orderId} is in ${order.status} status.
      It must be in a ${Order.STATUSES.PLACED} status to be filled.`.replace(/\s+/g, ' '))
  }

  // Need to add this functionality to the LND engine
  // const feeStatus = await this.engine.invoiceStatus(feeInvoice.paymentRequest);
  // const depositStatus = await this.engine.invoiceStatus(depositInvoice.paymentRequest);

  // if(feeStatus !== 'PAID') {
  //   throw new Error(`Fee Invoice for Order ${orderId} has not been paid.`);
  // }

  // if(depositStatus !== 'PAID') {
  //   throw new Error(`Deposit Invoice for Order ${orderId} has not been paid.`);
  // }

  // TODO: validate the payment requests on the user-supplied invoices
  const feeRefundInvoice = await Invoice.create({
    foreignId: fill._id,
    foreignType: Invoice.FOREIGN_TYPES.FILL,
    paymentRequest: feeRefundPaymentRequest,
    type: Invoice.TYPES.OUTGOING,
    purpose: Invoice.PURPOSES.FEE
  })
  const depositRefundInvoice = await Invoice.create({
    foreignId: fill._id,
    foreignType: Invoice.FOREIGN_TYPES.FILL,
    paymentRequest: depositRefundPaymentRequest,
    type: Invoice.TYPES.OUTGOING,
    purpose: Invoice.PURPOSES.DEPOSIT
  })

  this.logger.info('Refund invoices have been stored on the Relayer', {
    deposit: depositRefundInvoice._id,
    fee: feeRefundInvoice._id
  })

  // TODO: Check that the taker and maker are both reachable to complete

  await fill.accept()

  // note that the order does not get officially filled until `subscribeFill` takes it.
  await messenger.set(`fill:${order._id}`, fill.fillId)
  logger.info('order:filling', { orderId: order.orderId })

  return new FillOrderResponse({})
}

module.exports = fillOrder
