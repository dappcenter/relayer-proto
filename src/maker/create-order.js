
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

  // TODO: We need to figure out a way to handle async calls AND only expose
  // errors that the client cares about
  //
  // The current solution will display ALL application errors to the client which
  // is NOT ideal
  try {
    const order = new Order(this.db);
    const res = await order.create(params);

    this.logger.info('Order has been created', { payTo, orderId: order.orderId });

    // Create invoices w/ LND
    // TODO: need to figure out how we are going to calculate fees
    const ORDER_FEE = 0.001;

    // TODO: figure out how to calculate the expiry
    const INVOICE_EXPIRY = 60; // 60 seconds expiry for invoices

    const fee_memo = JSON.stringify({ type: 'fee', orderId: order.orderId });
    const deposit_memo = JSON.stringify({ type: 'deposit', orderId: order.orderId });
    // TODO: figure out what actions we want to take if fees/invoices cannot
    //   be produced for this order
    //
    //
    // This code theoretically will work for LND payments, but I need to hook
    // up a node so that we can test it (preferably on testnet)
    //
    // const depositRequest = await this.engine.addInvoice({
    //   memo: deposit_memo,
    //   value: 10,
    //   expiry: INVOICE_EXPIRY,
    // });
    // const feeRequest = await this.engine.addInvoice({
    //   memo: fee_memo,
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
    const invoice = new Invoice(this.db);
    const depositInvoice = await invoice.create({
      payTo: 'ln:1234',
      paymentRequest: depositPaymentRequest,
      type: 'INCOMING',
    });
    const feeInvoice = await invoice.create({
      payTo: 'ln:1234',
      paymentRequest: feePaymentRequest,
      type: 'INCOMING',
    });

    this.logger.info('Invoices have been created through Relayer', {
      deposit: depositInvoice.invoiceId,
      fee: feeInvoice.invoiceId,
    });

    this.logger.info('order:created', { orderId: order.id });

    return cb(null, {
      orderId: res.orderId,
      depositInvoice: depositInvoice.paymentRequest,
      feeInvoice: feeInvoice.paymentRequest,
    });
  } catch (e) {
    this.logger.error('Invalid Order: Could not process', { error: e.toString() });
    return cb({ message: e.message, code: status.INTERNAL });
  }
}

module.exports = createOrder;
