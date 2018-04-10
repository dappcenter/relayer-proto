const { status } = require('grpc');
const bigInt = require('big-integer');

const { Order, Invoice, Market } = require('../models');

// ORDER_DEPOSIT is bigInt equivelent of 0.001
const ORDER_DEPOSIT = bigInt(1000);

// ORDER_FEE is bigInt equivelent of 0.001
const ORDER_FEE = bigInt(1000);

// 2 minute expiry for invoices (in seconds)
const INVOICE_EXPIRY = 120;

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

  const params = {
    payTo: String(payTo),
    ownerId: String(ownerId),
    marketName: 'BTC/LTC',
    baseAmount: bigInt(baseAmount),
    counterAmount: bigInt(counterAmount),
    side: String(side),
  };

  //
  // TODO: figure out what actions we want to take if fees/invoices cannot
  //   be produced for this order
  //
  // TODO: figure out race condition where invoices are created, but we have failed
  //   to create them in the db?
  //
  try {
    const order = await Order.create(params);

    this.logger.info('Order has been created', { ownerId, orderId: order.orderId });

    // Create invoices w/ LND
    //
    const depositRequest = await this.engine.addInvoice({
      memo: JSON.stringify({ type: Invoice.PURPOSES.DEPOSIT, orderId: order.orderId }),
      value: 20,
      expiry: INVOICE_EXPIRY,
    });

    const feeRequest = await this.engine.addInvoice({
      memo: JSON.stringify({ type: Invoice.PURPOSES.FEE, orderId: order.orderId }),
      value: 20,
      expiry: INVOICE_EXPIRY,
    });

    this.logger.info('Invoices have been created through LND');

    // Persist the invoices to DB
    const depositInvoice = await Invoice.create({
      foreignId: order._id,
      foreignType: Invoice.FOREIGN_TYPES.ORDER,
      paymentRequest: depositRequest.paymentRequest,
      type: Invoice.TYPES.INCOMING,
      purpose: Invoice.PURPOSES.DEPOSIT,
    });

    const feeInvoice = await Invoice.create({
      foreignId: order._id,
      foreignType: Invoice.FOREIGN_TYPES.ORDER,
      paymentRequest: feeRequest.paymentRequest,
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
    this.logger.error('Invalid: Could not create order', { error: e.toString() });
    return cb({ message: 'Could not create order', code: status.INTERNAL });
  }
}

module.exports = createOrder;
