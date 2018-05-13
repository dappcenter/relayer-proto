const { expect, mock } = require('test/test-helper')

describe('taker index', () => {
  let taker

  beforeEach(() => {
    mock('./create-fill', {})
    mock('./fill-order', {})
    mock('./subscribe-execute', {})

    taker = require('./index')
  })

  afterEach(() => {
    mock.stopAll()
  })

  describe('implementations', () => {
    it('createFill', () => expect(taker.createFill).to.be.implemented())
    it('fillOrder', () => expect(taker.fillOrder).to.be.implemented())
    it('subscribeExecute', () => expect(taker.subscribeExecute).to.be.implemented())
  })
})
