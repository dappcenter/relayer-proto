const { expect, mock } = require('test/test-helper')

describe('payment-network index', () => {
  let orderbook

  beforeEach(() => {
    mock('./watch-market', {})

    orderbook = require('./index')
  })

  afterEach(() => {
    mock.stopAll()
  })

  describe('implementations', () => {
    it('getPublicKey', () => expect(orderbook.watchMarket).to.be.implemented())
  })
})
