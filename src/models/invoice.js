/**
 * Class representation of an order
 *
 * @author kinesis
 */

const safeid = require('generate-safe-id');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { Schema } = mongoose;
const INVOICE_TYPES = ['INCOMING', 'OUTGOING'];

const invoiceSchema = new Schema({
  // ownerId, in the case of LND, would be the user's LND public key
  invoiceId: { type: String, default: () => safeid() },
  ownerId: { type: String, required: true },
  paymentRequest: { type: String, required: true },
  type: { type: String, required: true, enum: INVOICE_TYPES },
});

/**
 * We only want the relayer to be able to set an invoiceId on the model. If there
 * is ever an invoiceId passed into the schema, we will prevent the saving of the record
 */
invoiceSchema.pre('create', (next) => {
  if (this.orderId) {
    this.invalidate('orderId');
  }
  next();
});

class Invoice {
  constructor(db) {
    this.db = db;
    this.invoice = this.db.model('Invoice', invoiceSchema);
  }

  async create(params) {
    return this.invoice.create(params);
  }
}

module.exports = Invoice;
