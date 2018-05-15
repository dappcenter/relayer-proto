const { PublicError } = require('../errors')

const { Order, FeeInvoice, DepositInvoice, FeeRefundInvoice, DepositRefundInvoice } = require('../models')

const FRIENDLY_ERRORS = {
  NOT_PLACED: id => `Could not place order. Please create another order and try again. Order id: ${id}`,
  FEE_NOT_PAID: id => `Fee Invoice has not been paid. Order id: ${id}`,
  DEPOSIT_NOT_PAID: id => `Deposit Invoice has not been paid. Order id: ${id}`
}

/**
 * Given an orderId and refundInvoice, place an order in the relayer. This will
 * make the order actionable to all other users.
 *
 * 1. Given the orderId, we need to check a few things
 *   - make sure that the fees and deposits have been paid
 *   - make sure it even exists
 *   - make sure that it is a valid order (not cancelled or whatever) preferably
 *     by querying mongo for created orders?
 *   - checks if the maker is reachable on Lightning Network on channels
 *   - sufficient to complete swap (depending on fill amount)
 * 2. Create a new order with the refundinvoice in the created status
 * 3. Broadcast to everyone
 *
 * @param {GrpcUnaryMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {Object} request.logger - logger for messages about the method
 * @param {EventEmitter} request.eventHandler - Event bus to put order messages onto
 * @param {Object} responses
 * @param {function} responses.PlaceOrderResponse - constructor for PlaceOrderResponse messages
 * @return {responses.PlaceOrderResponse}
 */
/* eslint-disable standard/no-callback-literal */
async function placeOrder ({ params, logger, eventHandler }, { PlaceOrderResponse }) {
  const { orderId, feeRefundPaymentRequest, depositRefundPaymentRequest } = params

  // TODO: validate ownership of the order
  const order = await Order.findOne({ orderId })
  const feeInvoice = await FeeInvoice.findOne({ foreignId: order._id })
  const depositInvoice = await DepositInvoice.findOne({ foreignId: order._id })

  // This circumstance means that either 1. the relayer messed up or 2. the CLI is broken.
  // In either scenario, there is nothing actionable that the user can do. We need to
  // cancel the order and prompt the user to retry the order again.
  if (!feeInvoice || !depositInvoice) {
    logger.error('Fee invoice could not be found for order', { orderId, feeInvoice, depositInvoice })
    // return cb({ message: FRIENDLY_ERRORS.NOT_PLACED(order.orderId), code: status.INTERNAL })
    throw new PublicError(FRIENDLY_ERRORS.NOT_PLACED(order.orderId))
  }

  const feeStatus = await this.engine.invoiceStatus(feeInvoice.rHash)
  const depositStatus = await this.engine.invoiceStatus(depositInvoice.rHash)

  if (!feeStatus.settled) {
    logger.error('Fee not paid for order', { orderId: order.orderId })
    // return cb({ message: FRIENDLY_ERRORS.FEE_NOT_PAID(order.orderId), code: status.INVALID_ARGUMENT })
    throw new PublicError(FRIENDLY_ERRORS.FEE_NOT_PAID(order.orderid))
  }

  if (!depositStatus.settled) {
    logger.error('Deposit not paid for order', { orderId: order.orderId })
    // return cb({ message: FRIENDLY_ERRORS.DEPOSIT_NOT_PAID(order.orderId), code: status.INVALID_ARGUMENT })
    throw new PublicError(FRIENDLY_ERRORS.DEPOSIT_NOT_PAID(order.orderId))
  }

  // TODO: validate the payment requests on the user-supplied invoices
  await FeeRefundInvoice.create({
    foreignId: order._id,
    paymentRequest: feeRefundPaymentRequest
    // We need the rHash
  })

  await DepositRefundInvoice.create({
    foreignId: order._id,
    paymentRequest: depositRefundPaymentRequest
    // We need the rHash
  })

  logger.info('Refund invoices have been stored on the Relayer')

  await order.place()

  eventHandler.emit('order:placed', order)
  logger.info('order:placed', { orderId: order.orderId })

  return new PlaceOrderResponse({})
}

module.exports = placeOrder
