const markets = require('../../config/markets');

class Market {
  constructor(marketName) {
    if (!markets.includes(marketName)) {
      throw new Error(`${marketName} is not supported.`);
    }
    const [baseSymbol, counterSymbol] = marketName.split('/');

    this.baseSymbol = baseSymbol;
    this.counterSymbol = counterSymbol;
  }

  get name() {
    return `${this.baseSymbol}/${this.counterSymbol}`;
  }

  static getByObject({ baseSymbol, counterSymbol }) {
    const market = this.markets[`${this.baseSymbol}/${this.counterSymbol}`];

    if (!market) {
      throw new Error(`Market for ${baseSymbol}/${counterSymbol} is not supported.`);
    }

    return market;
  }

  static getByName(marketName) {
    const market = this.markets[marketName];

    if (!market) {
      throw new Error(`Market for ${marketName} is not supported.`);
    }

    return market;
  }
}

Market.markets = markets.map(marketName => new Market(marketName));

module.exports = Market;
