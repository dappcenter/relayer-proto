/**
 * Class representation of an order
 *
 * @author kinesis
 */

const Enum = require('../utils/enum');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { Schema } = mongoose;
const INVOICE_TYPES = new Enum(['INCOMING', 'OUTGOING']);
const INVOICE_PURPOSES = new Enum(['FEE', 'DEPOSIT']);
const FOREIGN_TYPES = new Enum(['ORDER', 'FILL']);

const invoiceSchema = new Schema({
  foreignId: { type: String, required: true },
  foreignType: { type: String, required: true, enum: FOREIGN_TYPES.values() },
  paymentRequest: { type: String, required: true },
  type: { type: String, required: true, enum: INVOICE_TYPES.values() },
  purpose: { type: String, required: true, enum: INVOICE_PURPOSES.values() },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

Invoice.TYPES = INVOICE_TYPES;
Invoice.PURPOSES = INVOICE_PURPOSES;
Invoice.FOREIGN_TYPES = FOREIGN_TYPES;

module.exports = Invoice;
