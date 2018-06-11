const { FeeInvoice, DepositInvoice } = require('../models')
const bigInt = require('big-integer')

// DEPOSIT is bigInt equivelent of 0.001
const DEPOSIT = bigInt(1000)

// FEE is bigInt equivelent of 0.001
const FEE = bigInt(1000)

// 2 minute expiry for invoices (in seconds)
const INVOICE_EXPIRY = 120

/**
 * Create invoices in the relayer for a given order/fill
 *
 * @todo Create a virtual attribute for order/fill deposit to make sure this value is BigInt and not LONG
 * @param {Integer} amount for the invoice
 * @param {String} id of order/fill
 * @param {String} _id of order/fill
 * @param {Object} engine - Lightning Network engine
 * @param {String} foreign type (either order or fill)

 * @return {Array<Invoice>} invoices
 */
async function generateInvoices (amount, id, _id, engine, foreignType) {
  const deposit = DEPOSIT.divide(amount).value
  const fee = FEE.divide(amount).value

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
