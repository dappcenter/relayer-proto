const { FeeInvoice, DepositInvoice } = require('../models')

/**
 * @todo calculate the correct order deposit
 * @constant
 * @type {Number}
 * @default
 */
const DEPOSIT = 1000

/**
 * @todo calculate the correct order fee
 * @constant
 * @type {Number}
 * @default
 */
const FEE = 1000

/**
 * 2 minute expiry for invoices to be paid by the broker
 *
 * @constant
 * @type {Number}
 * @default
 */
const INVOICE_EXPIRY = 120

/**
 * Create invoices in the relayer for a given order/fill
 *
 * @todo Create a virtual attribute for order/fill deposit to make sure this value is Big and not LONG
 * @param {Integer} amount for the invoice
 * @param {String} id public id of order/fill
 * @param {String} _id id of order/fill
 * @param {Object} engine - Lightning Network engine
 * @param {String} foreign type (either order or fill)
 * @param {Logger} logger
 *
 * @return {Array<PaymentRequestHash>} invoices
 */
async function generateInvoices (amount, id, _id, engine, foreignType, logger) {
  const deposit = DEPOSIT
  const fee = FEE

  logger.info(`Creating invoices for ${id}`, {
    deposit,
    fee,
    baseAmount: amount
  })

  // Create the invoices on the specified engine. If either of these calls fail, the
  // invoices will be cleaned up after the expiry.
  // TODO: prevent DDoS through invoice creation
  const [depositHash, feeHash] = await Promise.all([
    engine.createInvoice(id, INVOICE_EXPIRY, deposit),
    engine.createInvoice(id, INVOICE_EXPIRY, fee)
  ])

  // Persist the invoices to the db
  const [depositInvoice, feeInvoice] = await Promise.all([
    DepositInvoice.create({ foreignId: _id, foreignType, paymentRequest: depositHash }),
    FeeInvoice.create({ foreignId: _id, foreignType, paymentRequest: feeHash })
  ])

  return [depositInvoice, feeInvoice]
}
module.exports = generateInvoices
