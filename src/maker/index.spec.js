const { expect, mock } = require('test/test-helper')

describe('payment-network index', () => {
  let maker

  beforeEach(() => {
    mock('./create-order', {})
    mock('./place-order', {})
    mock('./subscribe-fill', {})
    mock('./execute-order', {})
    mock('./complete-order', {})
    mock('./cancel-order', {})

    maker = require('./index')
  })

  afterEach(() => {
    mock.stopAll()
  })

  describe('implementations', () => {
    it('createOrder', () => expect(maker.createOrder).to.be.implemented())
    it('placeOrder', () => expect(maker.placeOrder).to.be.implemented())
    it('subscribeFill', () => expect(maker.subscribeFill).to.be.implemented())
    it('executeOrder', () => expect(maker.executeOrder).to.be.implemented())
    it('completeOrder', () => expect(maker.completeOrder).to.be.implemented())
    it('cancelOrder', () => expect(maker.cancelOrder).to.be.implemented())
  })
})
