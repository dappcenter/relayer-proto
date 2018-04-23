const { status } = require('grpc')

const { Order, FeeInvoice, DepositInvoice, FeeRefundInvoice, DepositRefundInvoice } = require('../models')

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
 * @param {grpc} call
 * @param {Function<err, message>} cb
 */
/* eslint-disable standard/no-callback-literal */
async function placeOrder (call, cb) {
  const { orderId, feeRefundPaymentRequest, depositRefundPaymentRequest } = call.request

  // TODO: validate ownership of the order
  try {
    const order = await Order.findOne({ orderId })
    const feeInvoice = await FeeInvoice.findOne({ foreignId: order._id })
    const depositInvoice = await DepositInvoice.findOne({ foreignId: order._id })

    if (!feeInvoice) return cb({ message: `No fee invoice associated with Order ${orderId}`, code: status.INVALID_ARGUMENT })
    if (!depositInvoice) return cb({ message: `No deposit invoice associated with Order ${orderId}`, code: status.INVALID_ARGUMENT })

    const feeStatus = await this.engine.invoiceStatus(feeInvoice.rHash)
    const depositStatus = await this.engine.invoiceStatus(depositInvoice.rHash)

    if (!feeStatus.settled) return cb({ message: `Fee Invoice for Order ${orderId} has not been paid`, code: status.INVALID_ARGUMENT })
    if (!depositStatus.settled) return cb({ message: `Deposit Invoice for Order ${orderId} has not been paid`, code: status.INVALID_ARGUMENT })

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

    this.logger.info('Refund invoices have been stored on the Relayer')

    await order.place()

    this.eventHandler.emit('order:placed', order)
    this.logger.info('order:placed', { orderId: order.orderId })

    return cb(null, {})
  } catch (e) {
    this.logger.error('Invalid: Could not place order', { error: e.toString(), stack: e.stack })
    return cb({ message: 'Could not place order', code: status.INTERNAL })
  }
}

module.exports = placeOrder
