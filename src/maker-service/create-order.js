const bigInt = require('big-integer')

const { FailedToCreateOrderError } = require('../errors')
const { Order, Market, FeeInvoice, DepositInvoice } = require('../models')

// ORDER_DEPOSIT is bigInt equivelent of 0.001
const ORDER_DEPOSIT = bigInt(1000)

// ORDER_FEE is bigInt equivelent of 0.001
const ORDER_FEE = bigInt(1000)

// 2 minute expiry for invoices (in seconds)
const INVOICE_EXPIRY = 120

/**
 * Create invoices in the relayer for a given order
 *
 * @todo Create a virtual attribute for order deposit to make sure this value is BigInt and not LONG
 * @param {Order} order
 * @return {Array<Invoice>} invoices
 */
async function generateInvoices (order, engine) {
  const orderDeposit = ORDER_DEPOSIT.divide(order.baseAmount).value
  const feeDeposit = ORDER_FEE.divide(order.baseAmount).value

  // Create the invoices on the specified engine. If either of these calls fail, the
  // invoices will be cleaned up after the expiry.
  // TODO: prevent DDoS through invoice creation
  const [deposit, fee] = Promise.all([
    engine.addInvoice({ memo: order.orderId, expiry: INVOICE_EXPIRY, value: orderDeposit }),
    engine.addInvoice({ memo: order.orderId, expiry: INVOICE_EXPIRY, value: feeDeposit })
  ])

  // Persist the invoices to the db
  const [depositInvoice, feeInvoice] = Promise.all([
    DepositInvoice.create({ foreignId: order._id, paymentRequest: deposit.paymentRequest, rHash: deposit.rHash }),
    FeeInvoice.create({ foreignId: order._id, paymentRequest: fee.paymentRequest, rHash: fee.rHash })
  ])

  return [depositInvoice, feeInvoice]
}

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
      baseAmount: bigInt(baseAmount),
      counterAmount: bigInt(counterAmount),
      side: String(side)
    })
  } catch (err) {
    throw new FailedToCreateOrderError(err)
  }

  logger.info('Order has been created', { ownerId, orderId: order.orderId })

  try {
    var [depositInvoice, feeInvoice] = await generateInvoices(order, engine)
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
