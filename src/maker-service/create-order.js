const { FailedToCreateOrderError } = require('../errors')
const { Order, Market, FeeInvoice } = require('../models')
const { generateInvoices, Big } = require('../utils')

/**
 * Creates an order with the relayer
 *
 * @todo implement transactions to clean up data if any DB call fails
 * @todo implement transaction so any invoice creations to lnd will be cleaned up
 * @param {GrpcUnaryMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {Object} request.logger - logger for messages about the method
 * @param {EventEmitter} request.eventHandler - Event bus to put order messages onto
 * @param {Object} request.engine - Lightning Network engine
 * @param {Object} responses
 * @param {function} responses.CreateOrderResponse - constructor for CreateOrderResponse messages
 * @return {responses.CreateOrderResponse}
 */
async function createOrder ({ params, logger, eventHandler, engine }, { CreateOrderResponse }) {
  const {
    payTo,
    ownerId,
    baseAmount,
    baseSymbol,
    counterAmount,
    counterSymbol,
    side
  } = params

  const market = Market.getByObject({
    baseSymbol: String(baseSymbol),
    counterSymbol: String(counterSymbol)
  })

  try {
    var order = await Order.create({
      payTo: String(payTo),
      ownerId: String(ownerId),
      marketName: market.name,
      baseAmount: Big(baseAmount),
      counterAmount: Big(counterAmount),
      side: String(side)
    })
  } catch (err) {
    throw new FailedToCreateOrderError(err)
  }

  logger.info('Order has been created', { ownerId, orderId: order.orderId })

  try {
    var [depositInvoice, feeInvoice] = await generateInvoices(order.baseAmount, order.orderId, order._id, engine, FeeInvoice.FOREIGN_TYPES.ORDER, logger)
  } catch (err) {
    throw new FailedToCreateOrderError(err)
  }

  logger.info('Invoices have been created through Relayer', {
    deposit: depositInvoice._id,
    fee: feeInvoice._id
  })

  eventHandler.emit('order:created', order)

  logger.info('order:created', { orderId: order.orderId })

  return new CreateOrderResponse({
    orderId: order.orderId,
    depositPaymentRequest: depositInvoice.paymentRequest,
    feePaymentRequest: feeInvoice.paymentRequest
  })
}

module.exports = createOrder
