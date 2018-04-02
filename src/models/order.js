/**
 * Class representation of an order
 *
 * @author kinesis
 */

const BigNumber = require('bignumber.js');
const safeid = require('generate-safe-id');

class Order {
  constructor({ baseAmount, baseSymbol, counterAmount, counterSymbol, swapPreimage = '', swapHash = '' }) {
    this.id = safeid();
    this.makerId = safeid();
    this.side = 'BID';

    // Figure out how to validate fields
    this.baseAmount = new BigNumber(baseAmount);
    this.baseSymbol = baseSymbol.toString('base64');
    this.counterAmount = new BigNumber(counterAmount);
    this.counterSymbol = counterSymbol.toString('base64');
    this.preimage = swapPreimage.toString('base64');
    this.hash = swapHash.toString('base64');

    // payTo?
  }

  valid() {
    return (
      this.validBaseAmount() &&
      this.validCounterAmount()
    );
  }

  validBaseAmount() {
    return (
      BigNumber.isBigNumber(this.baseAmount) &&
      this.baseAmount.isInteger() &&
      !this.baseAmount.isLessThanOrEqualTo(0)
    );
  }

  validCounterAmount() {
    return (
      BigNumber.isBigNumber(this.counterAmount) &&
      this.counterAmount.isInteger() &&
      !this.counterAmount.isLessThanOrEqualTo(0)
    );
  }
}

module.exports = Order;
