/**
 * Class representation of an order
 *
 * @author kinesis
 */

const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { Schema } = mongoose;
const INVOICE_TYPES = ['INCOMING', 'OUTGOING'];
const INVOICE_PURPOSES = ['FEE', 'DEPOSIT'];
const PARENT_TYPES = ['ORDER', 'FILL'];

const invoiceSchema = new Schema({
  foreignId: { type: String, required: true },
  foreignType: { type: String, required: true, enum: PARENT_TYPES },
  paymentRequest: { type: String, required: true },
  type: { type: String, required: true, enum: INVOICE_TYPES },
  purpose: { type: String, required: true, enum: INVOICE_PURPOSES },
});

module.exports = mongoose.model('Invoice', invoiceSchema);
