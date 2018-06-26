const ERRORS = {
  NOT_PLACED: id => `Could not place order. Please create another order and try again. Order id: ${id}`,
  FEE_NOT_PAID: id => `Fee Invoice has not been paid. Order id: ${id}`,
  DEPOSIT_NOT_PAID: id => `Deposit Invoice has not been paid. Order id: ${id}`,
  FEE_VALUES_UNEQUAL: id => `Fee Invoice Refund value is not the same as Fee Invoice value. Order id: ${id}`,
  DEPOSIT_VALUES_UNEQUAL: id => `Deposit Invoice Refund value is not the same as Deposit Invoice value. Order id: ${id}`,
  INSUFFICIENT_FUNDS_OUTBOUND: id => `Outbound channel does not have sufficient balance. Order id: ${id}`,
  INSUFFICIENT_FUNDS_INBOUND: id => `Inbound channel does not have sufficient balance. Order id: ${id}`
}

module.exports = ERRORS
