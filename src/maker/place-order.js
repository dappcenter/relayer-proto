const { status } = require('grpc');

const { Order, Invoice } = require('../models');

/**
 * Given an orderId and refundInvoice, place an order in the relayer. This will
 * make the order actionable to all other users.
 *
 * @param {grpc} call
 * @param {Function<err, message>} cb
 */
async function placeOrder(call, cb) {
  const { orderId, feeRefundPaymentRequest, depositRefundPaymentRequest } = call.request;

  // TODO: Need to validate these steps
  //
  // 1. Given the orderId, we need to check a few things
  //    - make sure that the fees and deposits have been paid
  //    - make sure it even exists
  //    - make sure that it is a valid order (not cancelled or whatever) preferably
  //      by querying mongo for created orders?
  //    - checks if the maker is reachable on Lightning Network on channels
  //    - sufficient to complete swap (depending on fill amount)
  // 2. Create a new order with the refundinvoice in the created status
  // 3. Broadcast to everyone
  //

  // TODO: validate ownership of the order

  try {
    const order = await Order.findOne({ orderId });
    const inboundInvoices = await Invoice.find({ foreignId: orderId, foreignType: 'ORDER', type: 'INCOMING' });

    if (inboundInvoices.length > 2) {
      // This is basically a corrupt state. Should we cancel the order or something?
      throw new Error(`Too many invoices associated with Order ${orderId}.`);
    }

    const feeInvoice = inboundInvoices.find(invoice => invoice.purpose === 'FEE');
    const depositInvoice = inboundInvoices.find(invoice => invoice.purpose === 'DEPOSIT');

    if (!feeInvoice) {
      throw new Error(`Could not find fee invoice associated with Order ${orderId}.`);
    }
    if (!depositInvoice) {
      throw new Error(`Could not find deposit invoice associated with Order ${orderId}.`);
    }

    // Need to add this functionality to the LND engine
    // const feeStatus = await this.engine.invoiceStatus(feeInvoice.paymentRequest);
    // const depositStatus = await this.engine.invoiceStatus(depositInvoice.paymentRequest);

    // if(feeStatus !== 'PAID') {
    //   throw new Error(`Fee Invoice for Order ${orderId} has not been paid.`);
    // }

    // if(depositStatus !== 'PAID') {
    //   throw new Error(`Deposit Invoice for Order ${orderId} has not been paid.`);
    // }

    // TODO: validate the payment requests on the user-supplied invoices
    const feeRefundInvoice = await Invoice.create({
      foreignId: orderId,
      foreignType: 'ORDER',
      paymentRequest: feeRefundPaymentRequest,
      type: 'OUTGOING',
      purpose: 'FEE',
    });
    const depositRefundInvoice = await Invoice.create({
      foreignId: orderId,
      foreignType: 'ORDER',
      paymentRequest: depositRefundPaymentRequest,
      type: 'OUTGOING',
      purpose: 'DEPOSIT',
    });

    this.logger.info('Refund invoices have been stored on the Relayer', {
      deposit: depositRefundInvoice._id,
      fee: feeRefundInvoice._id,
    });

    this.eventHandler.emit('order:placed', order.orderId, order);
    this.logger.info('order:placed', { orderId: order.orderId });

    return cb(null, {});
  } catch (e) {
    this.logger.error('Invalid Order: Could not process', { error: e.toString() });
    return cb({ message: e.message, code: status.INTERNAL });
  }
}

module.exports = placeOrder;
