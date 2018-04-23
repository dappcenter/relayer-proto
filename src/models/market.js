const markets = require('../../config/markets')

// TODO: Do we want to `toUpperCase` these names JIC?
class Market {
  constructor (marketName) {
    if (!Market._supportedMarket(marketName)) {
      throw new Error(`${marketName} is not supported.`)
    }

    // TODO: Maybe some validations if marketName.split returns a length
    //   greater than 2
    const [baseSymbol, counterSymbol] = marketName.split('/')

    this.name = marketName
    this.baseSymbol = baseSymbol
    this.counterSymbol = counterSymbol
  }

  /**
   * For a given object, return the marketName if it is supported or false
   * if it is not
   *
   * @param {Object<baseSymbol, counterSymbol} baseSymbol/counterSymbol
   * @returns {String} marketName - if there is a match
   * @returns {False} - if the passed in symbols are not a valid market
   */
  static getByObject ({ baseSymbol, counterSymbol }) {
    const marketName = [baseSymbol, counterSymbol].join('/')
    return new Market(marketName)
  }

  /**
   *
   * @param {Object<baseSymbol, counterSymbol} baseSymbol/counterSymbol
   * @returns {String} marketName - if there is a match
   * @returns {False} - if the passed in symbols are not a valid market
   */
  static getByName (marketName) {
    return new Market(marketName)
  }

  /**
   * Given a market name, returns a boolean if it is a supported market for the
   * relayer
   *
   * @param {String} marketName
   * @returns {Boolean}
   */
  static _supportedMarket (marketName) {
    return markets.includes(marketName)
  }
}

Market.markets = markets.map(marketName => new Market(marketName))

Market.SUPPORTED_MARKETS = Object.freeze(markets.reduce((acc, market) => {
  acc[market.name] = market.name
  return acc
}, {}))

module.exports = Market
