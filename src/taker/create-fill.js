
const { status } = require('grpc')
const bigInt = require('big-integer')

const { Order, Invoice, Fill } = require('../models')

/**
 * Given an order and set of params, creates a pending fill
 *
 * @param {*} createFill RPC
 * @param {Function<err, message>} cb
 */
async function createFill (call, cb) {
  const {
    orderId,
    swapHash,
    fillAmount
  } = call.request

  // TODO: We need to figure out a way to handle async calls AND only expose
  // errors that the client cares about
  //
  // TODO: figure out what actions we want to take if fees/invoices cannot
  //   be produced for this order
  //
  // TODO: figure out race condition where invoices are created, but we have failed
  //   to create them in the db?
  //
  try {
    const params = {
      orderId: String(orderId),
      swapHash: Buffer.from(swapHash, 'base64'),
      fillAmount: bigInt(fillAmount)
    }

    this.logger.info('createFill: Request to fill order received', params)

    const order = await Order.findOne({ orderId: params.orderId })

    if (!order) {
      throw new Error(`No order exists with Order ID ${params.orderId}.`)
    }

    if (order.status !== Order.STATUSES.PLACED) {
      throw new Error(`Order ID ${params.orderId} is not in a state to be filled.`)
    }

    const fill = await Fill.create({
      order_id: order._id,
      swapHash: params.swapHash,
      fillAmount: params.fillAmount
    })

    this.logger.info('createFill: Fill has been created', { orderId: order.orderId, fillId: fill.fillId })

    // Create invoices w/ LND
    // TODO: need to figure out how we are going to calculate fees
    /* eslint-disable no-unused-vars */
    const FILL_FEE = 0.001
    const FILL_DEPOSIT = 0.001

    // 2 minute expiry for invoices (in seconds)
    const INVOICE_EXPIRY = 120

    // TODO: figure out a better way to encode this
    const feeMemo = JSON.stringify({ type: 'fee', fillId: fill.fillId })
    const depositMemo = JSON.stringify({ type: 'deposit', fillId: fill.fillId })

    // This code theoretically will work for LND payments, but I need to hook
    // up a node so that we can test it (preferably on testnet)
    //
    // const depositRequest = await this.engine.addInvoice({
    //   memo: depositMemo,
    //   value: 10,
    //   expiry: INVOICE_EXPIRY,
    // });
    // const feeRequest = await this.engine.addInvoice({
    //   memo: feeMemo,
    //   value: 10,
    //   expiry: INVOICE_EXPIRY,
    // });
    //
    // const depositPaymentRequest = depositRequest.payment_request;
    // const feePaymentRequest = feeRequest.payment_request;

    const depositPaymentRequest = 'TESTFILLDEPOSIT'
    const feePaymentRequest = 'TESTFILLFEE'

    this.logger.info('createFill: Invoices have been created through LND')

    // Persist the invoices to DB
    const depositInvoice = await Invoice.create({
      foreignId: fill._id,
      foreignType: Invoice.FOREIGN_TYPES.FILL,
      paymentRequest: depositPaymentRequest,
      type: Invoice.TYPES.INCOMING,
      purpose: Invoice.PURPOSES.DEPOSIT
    })
    const feeInvoice = await Invoice.create({
      foreignId: fill._id,
      foreignType: Invoice.FOREIGN_TYPES.FILL,
      paymentRequest: feePaymentRequest,
      type: Invoice.TYPES.INCOMING,
      purpose: Invoice.PURPOSES.FEE
    })

    this.logger.info('createFill: Invoices have been created through Relayer', {
      deposit: depositInvoice._id,
      fee: feeInvoice._id
    })

    this.eventHandler.emit('fill:created', fill)
    this.logger.info('fill:created', { fillId: fill.fillId })

    return cb(null, {
      fillId: fill.fillId,
      depositPaymentRequest: depositInvoice.paymentRequest,
      feePaymentRequest: feeInvoice.paymentRequest
    })
  } catch (e) {
    // TODO: filtering client friendly errors from internal errors
    this.logger.error('Invalid Order: Could not process', { error: e.toString() })
    // eslint-disable-next-line
    return cb({ message: e.message, code: status.INTERNAL })
  }
}

module.exports = createFill
