const { expect, mock } = require('test/test-helper')

describe('payment-network index', () => {
  let paymentNetwork

  beforeEach(() => {
    mock('./get-public-key', {})

    paymentNetwork = require('./index')
  })

  afterEach(() => {
    mock.stopAll()
  })

  describe('implementations', () => {
    it('getPublicKey', () => expect(paymentNetwork.getPublicKey).to.be.implemented())
  })
})
