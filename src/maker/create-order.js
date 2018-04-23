const { status } = require('grpc')
const bigInt = require('big-integer')

const { Order, Market, FeeInvoice, DepositInvoice } = require('../models')

// ORDER_DEPOSIT is bigInt equivelent of 0.001
const ORDER_DEPOSIT = bigInt(1000)

// ORDER_FEE is bigInt equivelent of 0.001
const ORDER_FEE = bigInt(1000)

// 2 minute expiry for invoices (in seconds)
const INVOICE_EXPIRY = 120

/**
 * Given a set of params, creates an order
 *
 * @param {*} createOrder RPC
 * @param {Function<err, message>} cb
 */
async function createOrder (call, cb) {
  const {
    payTo,
    ownerId,
    baseAmount,
    baseSymbol,
    counterAmount,
    counterSymbol,
    side
  } = call.request

  //
  // TODO: figure out what actions we want to take if fees/invoices cannot
  //   be produced for this order
  //
  // TODO: figure out race condition where invoices are created, but we have failed
  //   to create them in the db?
  //
  try {
    const market = Market.getByObject({
      baseSymbol: String(baseSymbol),
      counterSymbol: String(counterSymbol)
    })

    const params = {
      payTo: String(payTo),
      ownerId: String(ownerId),
      marketName: market.name,
      baseAmount: bigInt(baseAmount),
      counterAmount: bigInt(counterAmount),
      side: String(side)
    }
    const order = await Order.create(params)

    this.logger.info('Order has been created', { ownerId, orderId: order.orderId })

    // Create invoices w/ LND
    //
    const depositRequest = await this.engine.addInvoice({
      memo: order.orderId,
      value: ORDER_DEPOSIT.times(order.base).value,
      expiry: INVOICE_EXPIRY
    })

    const feeRequest = await this.engine.addInvoice({
      memo: order.orderId,
      value: ORDER_FEE.times(order.base).value,
      expiry: INVOICE_EXPIRY
    })

    this.logger.info('Invoices have been created through LND')

    // Persist the invoices to DB
    const depositInvoice = await DepositInvoice.create({
      foreignId: order._id,
      paymentRequest: depositRequest.paymentRequest,
      rHash: depositRequest.rHash
    })

    const feeInvoice = await FeeInvoice.create({
      foreignId: order._id,
      paymentRequest: feeRequest.paymentRequest,
      rHash: feeRequest.rHash
    })

    this.logger.info('Invoices have been created through Relayer', {
      deposit: depositInvoice._id,
      fee: feeInvoice._id
    })

    this.eventHandler.emit('order:created', order)
    this.logger.info('order:created', { orderId: order.orderId })

    return cb(null, {
      orderId: order.orderId,
      depositPaymentRequest: depositInvoice.paymentRequest,
      feePaymentRequest: feeInvoice.paymentRequest
    })
  } catch (e) {
    this.logger.error('Invalid: Could not create order', { error: e.toString() })
    // eslint-disable-next-line
    return cb({ message: 'Could not create order', code: status.INTERNAL })
  }
}

module.exports = createOrder
