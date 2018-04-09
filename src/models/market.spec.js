const mock = require('mock-require');
const chai = require('chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(require('sinon-chai'));

describe('Market', () => {
  let Market;
  let sandbox;

  before(() => { sandbox = sinon.sandbox.create(); });
  afterEach(() => { sandbox.restore(); });

  beforeEach(() => {
    mock('../../config/markets', [
      'BTC/LTC',
    ]);
    Market = require('./market');
  });

  describe('#new', () => {
    let market;
    let marketName;

    context('valid market name', () => {
      beforeEach(() => {
        marketName = 'BTC/LTC';
        market = new Market(marketName);
      });

      it('has a name property', () => {
        expect(market.name).to.eql(marketName);
      });

      it('has a counterSymbol property', () => {
        expect(market.counterSymbol).to.eql('LTC');
      });

      it('has a baseSymbol property', () => {
        expect(market.baseSymbol).to.eql('BTC');
      });
    });

    context('an invalid market name', () => {
      beforeEach(() => {
        marketName = 'BTC/TEST';
      });

      it('throws an error', () => {
        expect(() => new Market(marketName)).to.throw(`${marketName} is not supported.`);
      });
    });
  });

  describe('getByObject', () => {
    it('returns false if the marketName is not found', () => {
      const badMarket = {
        baseSymbol: 'DAN',
        counterSymbol: 'TEST',
      };
      expect(Market.getByObject(badMarket)).to.eql(false);
    });

    it('returns the marketName if the marketName is found', () => {
      const goodMarket = {
        baseSymbol: 'BTC',
        counterSymbol: 'LTC',
      };
      const expectedResponse = 'BTC/LTC';
      expect(Market.getByObject(goodMarket)).to.eql(expectedResponse);
    });
  });

  describe('getByName', () => {
    it('returns false if the marketName is not found', () => {
      const badMarketName = 'BTC/TEST';
      expect(Market.getByName(badMarketName)).to.eql(false);
    });

    it('returns the marketName if the marketName is found', () => {
      const goodMarketName = 'BTC/LTC';
      expect(Market.getByName(goodMarketName)).to.eql(goodMarketName);
    });
  });
});
