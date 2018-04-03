
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
    ownerId,
    baseAmount,
    baseSymbol,
    counterAmount,
    counterSymbol,
    side,
    swapPreimage,
    swapHash,
  } = call.request;

  const params = {
    ownerId: String(ownerId),
    baseAmount: bigInt(baseAmount),
    baseSymbol: String(baseSymbol),
    counterAmount: bigInt(counterAmount),
    counterSymbol: String(counterSymbol),
    side: String(side),
    swapPreimage: String(swapPreimage),
    swapHash: String(swapHash),
  };

  // TODO: We need to figure out a way to handle async calls AND only expose
  // errors that the client cares about
  //
  // The current solution will display ALL application errors to the client which
  // is NOT ideal
  try {
    const order = new Order(this.db);
    const res = await order.create(params);

    this.logger.info('Order has been created', { ownerId, orderId: order.orderId });

    // Create invoices w/ LND
    // TODO: need to figure out how we are going to calculate fees
    // TODO: figure out how to calculate the expiry
    // TODO: figure out what actions we want to take if fees/invoices cannot
    //   be produced for this order
    //
    //
    // This code theoretically will work for LND payments, but I need to hook
    // up a node so that we can test it (preferably on testnet)
    //
    // const depositRequest = await this.engine.addInvoice({
    //   value: 10,
    //   // preimage
    //   // expiry
    // });
    // const feeRequest = await this.engine.addInvoice({
    //   value: 10,
    //   // preimage
    //   // expiry
    // });
    // const depositPaymentRequest = depositRequest.payment_request;
    // const feePaymentRequest = feeRequest.payment_request;

    const depositPaymentRequest = 'TESTDEPOSIT';
    const feePaymentRequest = 'TESTFEE';

    this.logger.info('Invoices have been created through LND');

    // Persist the invoices to DB
    // TODO: Not sure if we even care about this (need info from Trey)
    const invoice = new Invoice(this.db);
    const depositInvoice = await invoice.create({
      ownerId: 'ln:1234',
      paymentRequest: depositPaymentRequest,
      type: 'INCOMING',
    });
    const feeInvoice = await invoice.create({
      ownerId: 'ln:1234',
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
