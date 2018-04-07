const markets = require('../../config/markets');

class Market {
  constructor(marketName) {
    const [baseSymbol, counterSymbol] = marketName.split('/');

    // TODO: We should just fail if the market is incorrect since we have a mapping
    // of the correct markets that we want to support.
    if (counterSymbol < baseSymbol) {
      throw new Error(`Market names must be in alphabetical order.
        ${counterSymbol} comes before ${baseSymbol} alphabetically.`.replace(/\s+/g, ' '));
    }

    this.baseSymbol = baseSymbol;
    this.counterSymbol = counterSymbol;
  }

  get name() {
    return `${this.baseSymbol}/${this.counterSymbol}`;
  }

  // TODO: We should never create a new market (because we potentially dont support it)
  static fromObject({ baseSymbol, counterSymbol }) {
    return new Market(`${baseSymbol}/${counterSymbol}`);
  }
}

Market.markets = markets.map(marketName => new Market(marketName));

module.exports = Market;
