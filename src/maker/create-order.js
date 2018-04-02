
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

const { Order, Invoice } = require('../models');

async function createOrder(call, cb) {
  const rawOrder = call.request;

  // From the request, parse the raw order
  // Check if the orderId is already present in the db
  // if the order isn't present then place the order
  // Additionally, at this point we could probably create a uuid
  const order = new Order(rawOrder);

  // TODO: Depending on which field is wrong, provide feeback to the callback
  if (order.valid() === false) {
    this.logger.error('Invalid Order: Could not process');
    return cb({ message: 'Invalid Order: Could not process', code: status.INVALID_ARGUMENT });
  }

  this.db.marketevents.save(order.export());

  // request to LND
  const depositInvoice = new Invoice('1234');

  // request to LND
  const feeInvoice = new Invoice('5678');

  this.logger.info('order:created', { orderId: order.id });

  return cb(null, { orderId: order.id, depositInvoice, feeInvoice });
}

module.exports = createOrder;
