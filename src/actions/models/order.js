/**
 * Class representation of an order
 *
 * @author kinesis
 */

const BigNumber = require('bignumber.js');

const MARKET_SIDES = {
  ASK: 'ASK',
  BID: 'BID',
};

class Order {
  constructor({ id, status, baseAmount, baseSymbol, counterAmount, counterSymbol, side}) {
    this.id = id;
    this.status = status;
    this.baseAmount = baseAmount;
    this.baseSymbol = baseSymbol;
    this.counterAmount = counterAmount;
    this.counterSymbol = counterSymbol;
    this.side = side;

    // payTo?
    // preimage?
    // hash?
  }

  valid() {
    return (
      this.validMarketSide() &&
      this.validBaseAmount() &&
      this.validCounterAmount()
    );
  }

  validMarketSide() {
    return Object.values(MARKET_SIDES).includes(this.side);
  }

  validBaseAmount() {
    return this.validAmount(this.baseAmount);
  }

  validCounterAmount() {
    return this.validAmount(this.counterAmount);
  }

  validAmount(amount) {
    return (
      BigNumber.isBigNumber(amount) &&
      amount.isInteger() &&
      amount.isLessThanOrEqualTo(0)
    )
  }

  /**
   * Returns the format of an order specified by gRPC RelayerClient
   *
   * TODO: Probably another way to do this (IE editing the proto)
   * @returns {Object} order
   */
  export() {
    return {
      orderId: this.id,
      orderStatus: this.status,
      order: {
        baseSymbol: this.baseSymbol,
        counterSymbol: this.counterSymbol,
        baseAmount: this.baseAmount,
        counterAmount: this.counterAmount,
        side: this.side,
      },
    };
  }

  /**
   * Returns a formatted order. If any keys are missing from the payload, they will be omitted
   * in the output
   *
   * TODO: This is temporary. This can be removed when models are officially created for db
   *
   * @param {option} baseAmount
   * @param {option} counterAmount
   * @param {option} fillAmount
   * @param {option} swapPreimage
   * @param {option} swapHash
   * @returns {Object} order
   */
  static toWire({ baseAmount, counterAmount, fillAmount, swapPreimage, swapHash, side, status, payTo }) {
    // TODO: break off logic for these amounts into its own "model"
    const base = (baseAmount || baseAmount === 0 ? { baseAmount: baseAmount.toFixed(0) } : null);
    const counter = (counterAmount || counterAmount === 0 ? { counterAmount: counterAmount.toFixed(0) } : null);
    const fill = (fillAmount || fillAmount === 0 ? { fillAmount: fillAmount.toFixed(0) } : null);
    const preimage = (swapPreimage ? { swapPreimage: swapPreimage.toString('base64') } : null);
    const hash = (swapHash ? { swapHash: swapHash.toString('base64') } : null);

    return Object.assign({}, base, counter, fill, preimage, hash, { side, status, payTo });
  }

  /**
   * Receives a payload from a request and returns an 'order' object. If any keys are
   * missing from the payload, they will be omitted in the output
   *
   * @param {*} payload
   * @returns {Object} order
   */
  static fromWire(payload) {
    const order = this._formatWireInput(payload);
    const { baseAmount, counterAmount, fillAmount, swapPreimage, swapHash, side, status, payTo } = order;

    // TODO could make this into a model/formatter
    // TODO: break off logic for these amounts into its own "model"
    const base = (baseAmount || baseAmount === 0 ? { baseAmount: new BigNumber(baseAmount) } : null);
    const counter = (counterAmount || counterAmount === 0 ? { counterAmount: new BigNumber(counterAmount) } : null);
    const fill = (fillAmount || fillAmount === 0 ? { fillAmount: new BigNumber(fillAmount) } : null);
    const preimage = (swapPreimage ? { swapPreimage: Buffer.from(swapPreimage, 'base64') } : null);
    const hash = (swapHash ? { swapHash: Buffer.from(swapHash, 'base64') } : null);

    return Object.assign({}, base, counter, fill, preimage, hash, { side, status, payTo });
  }

  /**
   * Given some kind of input (typically a string), we need to convert the value
   * to an object.
   *
   * @param {*} thing
   * @return {Object} payload
   */
  static _formatWireInput(thing) {
    // TODO probably some error handling. We will need to create a pattern for how
    // we want to expose errors to the client
    if (typeof thing === 'string') {
      return JSON.parse(thing);
    }

    return Object.assign({}, thing);
  }

  /**
   * Outputs a string from an order to be saved to the DB
   *
   * @param {Object} obj
   * @returns {String} JSON formatted string
   */
  static toDb(obj) {
    return JSON.stringify(this.toWire(obj));
  }

  /**
   * Given a buffer, returns an object with order data
   *
   * @param {Object} obj
   * @returns {Object}
   */
  static fromDb(buf) {
    return this.fromWire(buf.toString());
  }
}

module.exports = Order;
