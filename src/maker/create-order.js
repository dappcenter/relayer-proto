
/**
 * LND.
 *
 * For invoices on LND we will need specify
 * 1. value
 * 2. expiry
 * 3. memo
 *
 * All of this information is stored in the payment_request
 */

const { status } = require('grpc');
const bigInt = require('big-integer');

const { Order, Invoice } = require('../models');


/**
 * Given a set of params, creates an order
 *
 * @param {*} createOrder RPC
 * @param {Function<err, message>} cb
 */
async function createOrder(call, cb) {
  const {
    payTo,
    ownerId,
    baseAmount,
    baseSymbol,
    counterAmount,
    counterSymbol,
    side,
  } = call.request;

  // TODO: wrap these params into a try catch incase the type casting fails
  //   which would probably be an indication of tampering?
  const params = {
    payTo: String(payTo),
    ownerId: String(ownerId),
    baseAmount: bigInt(baseAmount),
    baseSymbol: String(baseSymbol),
    counterAmount: bigInt(counterAmount),
    counterSymbol: String(counterSymbol),
    side: String(side),
  };

  this.logger.info('Request to create order received', params);

  // TODO: We need to figure out a way to handle async calls AND only expose
  // errors that the client cares about
  //
  // The current solution will display ALL application errors to the client which
  // is NOT ideal
  try {
    const order = await Order.create(params);

    this.logger.info('Order has been created', { ownerId, orderId: order.orderId });

    // Create invoices w/ LND
    // TODO: need to figure out how we are going to calculate fees
    const ORDER_FEE = 0.001;
    const ORDER_DEPOSIT = 0.001;

    // TODO: figure out how to calculate the expiry
    const INVOICE_EXPIRY = 60; // 60 seconds expiry for invoices

    // TODO: figure out a better way to encode this
    const feeMemo = JSON.stringify({ type: 'fee', orderId: order.orderId });
    const depositMemo = JSON.stringify({ type: 'deposit', orderId: order.orderId });
    // TODO: figure out what actions we want to take if fees/invoices cannot
    //   be produced for this order
    //
    //
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

    const depositPaymentRequest = 'TESTDEPOSIT';
    const feePaymentRequest = 'TESTFEE';

    this.logger.info('Invoices have been created through LND');

    // Persist the invoices to DB
    const depositInvoice = await Invoice.create({
      foreignId: order._id,
      foreignType: Invoice.FOREIGN_TYPES.ORDER,
      paymentRequest: depositPaymentRequest,
      type: Invoice.TYPES.INCOMING,
      purpose: Invoice.PURPOSES.DEPOSIT,
    });
    const feeInvoice = await Invoice.create({
      foreignId: order._id,
      foreignType: Invoice.FOREIGN_TYPES.ORDER,
      paymentRequest: feePaymentRequest,
      type: Invoice.TYPES.INCOMING,
      purpose: Invoice.PURPOSES.FEE,
    });

    this.logger.info('Invoices have been created through Relayer', {
      deposit: depositInvoice._id,
      fee: feeInvoice._id,
    });

    this.eventHandler.emit('order:created', order);
    this.logger.info('order:created', { orderId: order.orderId });

    return cb(null, {
      orderId: order.orderId,
      depositPaymentRequest: depositInvoice.paymentRequest,
      feePaymentRequest: feeInvoice.paymentRequest,
    });
  } catch (e) {
    // TODO: filtering client friendly errors from internal errors
    this.logger.error('Invalid Order: Could not process', { error: e.toString() });
    return cb({ message: e.message, code: status.INTERNAL });
  }
}

module.exports = createOrder;
