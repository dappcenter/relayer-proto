const bigInt = require('big-integer')
const { Order, Fill, Invoice } = require('../models')
const { generateInvoices } = require('../utils')
const { FailedToCreateFillError } = require('../errors')

/**
 * Given an order and set of params, creates a pending fill
 *
 * @param {GrpcUnaryMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {Object} request.logger - logger for messages about the method
 * @param {EventEmitter} request.eventHandler - Event bus to put order messages onto
 * @param {Object} responses
 * @param {function} responses.CreateFillResponse - constructor for CreateFillResponse messages
 * @return {responses.CreateFillResponse}
 */
async function createFill ({ params, logger, eventHandler, engine }, { CreateFillResponse }) {
  const {
    orderId,
    swapHash,
    fillAmount
  } = params

  // TODO: We need to figure out a way to handle async calls AND only expose
  // errors that the client cares about
  //
  // TODO: figure out what actions we want to take if fees/invoices cannot
  //   be produced for this order
  //
  // TODO: figure out race condition where invoices are created, but we have failed
  //   to create them in the db?
  //
  const safeParams = {
    orderId: String(orderId),
    swapHash: Buffer.from(swapHash, 'base64'),
    fillAmount: bigInt(fillAmount)
  }

  const order = await Order.findOne({ orderId: safeParams.orderId })

  if (!order) {
    throw new Error(`No order exists with Order ID ${safeParams.orderId}.`)
  }

  if (order.status !== Order.STATUSES.PLACED) {
    throw new Error(`Order ID ${safeParams.orderId} is not in a state to be filled.`)
  }

  if (bigInt(fillAmount).greater(order.baseAmount)) {
    throw new Error(`Fill amount is larger than order baseAmount for Order ID ${safeParams.orderId}.`)
  }

  try {
    var fill = await Fill.create({
      order_id: order._id,
      swapHash: safeParams.swapHash,
      fillAmount: safeParams.fillAmount
    })
  } catch (err) {
    throw new FailedToCreateFillError(err)
  }

  logger.info('createFill: Fill has been created', { orderId: order.orderId, fillId: fill.fillId })

  try {
    var [depositInvoice, feeInvoice] = await generateInvoices(fill.fillAmount, fill.fillId, fill._id, engine, Invoice.FOREIGN_TYPES.FILL)
  } catch (err) {
    throw new FailedToCreateFillError(err)
  }

  logger.info('createFill: Invoices have been created through Relayer', {
    deposit: depositInvoice._id,
    fee: feeInvoice._id
  })

  eventHandler.emit('fill:created', fill)
  logger.info('fill:created', { fillId: fill.fillId })

  return new CreateFillResponse({
    fillId: fill.fillId,
    depositPaymentRequest: depositInvoice.paymentRequest,
    feePaymentRequest: feeInvoice.paymentRequest
  })
}

module.exports = createFill
