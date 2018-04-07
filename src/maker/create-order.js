const { status } = require('grpc');
const bigInt = require('big-integer');

const { Order, Invoice, Market } = require('../models');

// TODO: Figure out if we want to have a rolling fee
const ORDER_FEE = 0.001;

// TODO: Figure out how we want to calculate the deposit
const ORDER_DEPOSIT = 0.001;

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
    // TODO:
    marketName: Market.fromObject({ baseSymbol, counterSymbol }).name,
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
    var order = await Order.create(params);
  } catch (e) {
    this.logger.error('Invalid: Could not create order', { error: e.toString() });
    return cb({ message: 'Could not create order', code: status.INTERNAL });
  }

  this.logger.info('Order has been created', { ownerId, orderId: order.orderId });

  // Create invoices w/ LND
  //
  try {
    var depositRequest = await this.engine.addInvoice({
      memo: JSON.stringify({ type: Invoice.PURPOSES.DEPOSIT, orderId: order.orderId }),
      value: 10,
      expiry: INVOICE_EXPIRY,
    });
  } catch (e) {
    this.logger.error('Invalid: Could not create deposit invoice', { error: e.toString() });
    return cb({ message: 'Could not create order', code: status.INTERNAL });
  }

  try {
    var feeRequest = await this.engine.addInvoice({
      memo: JSON.stringify({ type: Invoice.PURPOSES.FEE, orderId: order.orderId }),
      value: 10,
      expiry: INVOICE_EXPIRY,
    });
  } catch (e) {
    this.logger.error('Invalid: Could not create fee invoice', { error: e.toString() });
    return cb({ message: 'Could not create order', code: status.INTERNAL });
  }

  this.logger.info('Invoices have been created through LND');

  // Persist the invoices to DB
  try {
    var depositInvoice = await Invoice.create({
      foreignId: order._id,
      foreignType: Invoice.FOREIGN_TYPES.ORDER,
      paymentRequest: depositRequest.payment_request,
      type: Invoice.TYPES.INCOMING,
      purpose: Invoice.PURPOSES.DEPOSIT,
    });
  } catch (e) {
    this.logger.error('Invalid: Could not persist deposit invoice', { error: e.toString() });
    return cb({ message: 'Could not create order', code: status.INTERNAL });
  }

  try {
    var feeInvoice = await Invoice.create({
      foreignId: order._id,
      foreignType: Invoice.FOREIGN_TYPES.ORDER,
      paymentRequest: feeRequest.payment_request,
      type: Invoice.TYPES.INCOMING,
      purpose: Invoice.PURPOSES.FEE,
    });
  } catch (e) {
    this.logger.error('Invalid: Could not persist fee invoice', { error: e.toString() });
    return cb({ message: 'Could not create order', code: status.INTERNAL });
  }

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
}

module.exports = createOrder;
