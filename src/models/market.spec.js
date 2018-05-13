const { mock, chai } = require('test/test-helper')

const { expect } = chai

describe('Market', () => {
  let Market

  beforeEach(() => {
    mock('../../config/markets', [
      'BTC/LTC'
    ])
    Market = require('./market')
  })

  describe('#new', () => {
    let market
    let marketName

    context('valid market name', () => {
      beforeEach(() => {
        marketName = 'BTC/LTC'
        market = new Market(marketName)
      })

      it('has a name property', () => {
        expect(market.name).to.eql(marketName)
      })

      it('has a counterSymbol property', () => {
        expect(market.counterSymbol).to.eql('LTC')
      })

      it('has a baseSymbol property', () => {
        expect(market.baseSymbol).to.eql('BTC')
      })
    })

    context('an invalid market name', () => {
      beforeEach(() => {
        marketName = 'BTC/TEST'
      })

      it('throws an error', () => {
        expect(() => new Market(marketName)).to.throw(`${marketName} is not supported.`)
      })
    })
  })

  describe('getByObject', () => {
    it('throws an exception if the marketName is not found', () => {
      const badMarket = {
        baseSymbol: 'DAN',
        counterSymbol: 'TEST',
        name: 'DAN/TEST'
      }
      expect(() => Market.getByObject(badMarket)).to.throw(`${badMarket.name} is not supported.`)
    })

    it('returns a market object if the marketName is found', () => {
      const goodMarket = {
        baseSymbol: 'BTC',
        counterSymbol: 'LTC',
        name: 'BTC/LTC'
      }
      const market = Market.getByObject(goodMarket)
      expect(market.baseSymbol).to.eql(goodMarket.baseSymbol)
      expect(market.counterSymbol).to.eql(goodMarket.counterSymbol)
      expect(market.name).to.eql(goodMarket.name)
    })
  })

  describe('getByName', () => {
    it('throws an exception if the marketName is not found', () => {
      const badMarketName = 'BTC/TEST'
      expect(() => Market.getByName(badMarketName)).to.throw(`${badMarketName} is not supported.`)
    })

    it('returns a market object if the marketName is found', () => {
      const goodMarket = {
        baseSymbol: 'BTC',
        counterSymbol: 'LTC',
        name: 'BTC/LTC'
      }
      const market = Market.getByName(goodMarket.name)
      expect(market.baseSymbol).to.eql(goodMarket.baseSymbol)
      expect(market.counterSymbol).to.eql(goodMarket.counterSymbol)
      expect(market.name).to.eql(goodMarket.name)
    })
  })
})
