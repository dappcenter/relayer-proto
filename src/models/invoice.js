/**
 * Class representation of an order
 *
 * @author kinesis
 */
const mongoose = require('mongoose')
require('mongoose-long')(mongoose)

const { Schema } = mongoose

const INVOICE_TYPES = Object.freeze({
  INCOMING: 'INCOMING',
  OUTGOING: 'OUTGOING'
})

const INVOICE_PURPOSES = Object.freeze({
  FEE: 'FEE',
  DEPOSIT: 'DEPOSIT'
})

const FOREIGN_TYPES = Object.freeze({
  ORDER: 'ORDER',
  FILL: 'FILL'
})

const options = { discriminatorKey: 'kind' }

const invoiceSchema = new Schema({
  foreignId: { type: String, required: true },
  foreignType: { type: String, required: true, enum: Object.values(FOREIGN_TYPES) },
  paymentRequest: { type: String, required: true },
  type: { type: String, required: true, enum: Object.values(INVOICE_TYPES) },
  purpose: { type: String, required: true, enum: Object.values(INVOICE_PURPOSES) }
}, options)

invoiceSchema.statics.TYPES = INVOICE_TYPES
invoiceSchema.statics.PURPOSES = INVOICE_PURPOSES
invoiceSchema.statics.FOREIGN_TYPES = FOREIGN_TYPES

const Invoice = mongoose.model('Invoice', invoiceSchema)

const FeeInvoice = Invoice.discriminator('FeeInvoice', new mongoose.Schema({
  foreignType: { type: String, default: FOREIGN_TYPES.ORDER },
  type: { type: String, default: INVOICE_TYPES.INCOMING },
  purpose: { type: String, default: INVOICE_PURPOSES.FEE }
}, options))

const DepositInvoice = Invoice.discriminator('DepositInvoice', new mongoose.Schema({
  foreignType: { type: String, default: FOREIGN_TYPES.ORDER },
  type: { type: String, default: INVOICE_TYPES.INCOMING },
  purpose: { type: String, default: INVOICE_PURPOSES.DEPOSIT }
}, options))

const FeeRefundInvoice = Invoice.discriminator('FeeRefundInvoice', new mongoose.Schema({
  foreignType: { type: String, default: FOREIGN_TYPES.ORDER },
  type: { type: String, default: INVOICE_TYPES.OUTGOING },
  purpose: { type: String, default: INVOICE_PURPOSES.FEE }
}, options))

const DepositRefundInvoice = Invoice.discriminator('DepositRefundInvoice', new mongoose.Schema({
  foreignType: { type: String, default: FOREIGN_TYPES.ORDER },
  type: { type: String, default: INVOICE_TYPES.OUTGOING },
  purpose: { type: String, default: INVOICE_PURPOSES.DEPOSIT }
}, options))

module.exports = {
  FeeInvoice,
  DepositInvoice,
  FeeRefundInvoice,
  DepositRefundInvoice
}
