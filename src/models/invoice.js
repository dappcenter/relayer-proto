/**
 * Class representation of an order
 *
 * @author kinesis
 */

const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { Schema } = mongoose;

const INVOICE_TYPES = Object.freeze({
  INCOMING: 'INCOMING',
  OUTGOING: 'OUTGOING',
});

const INVOICE_PURPOSES = Object.freeze({
  FEE: 'FEE',
  DEPOSIT: 'DEPOSIT',
});

const FOREIGN_TYPES = Object.freeze({
  ORDER: 'ORDER',
  FILL: 'FILL',
});

const invoiceSchema = new Schema({
  foreignId: { type: String, required: true },
  foreignType: { type: String, required: true, enum: FOREIGN_TYPES.values() },
  paymentRequest: { type: String, required: true },
  type: { type: String, required: true, enum: INVOICE_TYPES.values() },
  purpose: { type: String, required: true, enum: INVOICE_PURPOSES.values() },
});

invoiceSchema.virtual('TYPES').get(() => INVOICE_TYPES);
invoiceSchema.virtual('PURPOSES').get(() => INVOICE_PURPOSES);
invoiceSchema.virtual('FOREIGN_TYPES').get(() => FOREIGN_TYPES);

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
