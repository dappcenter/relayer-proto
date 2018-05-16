const { expect, mock } = require('test/test-helper')

describe('errors index', () => {
  let errors

  beforeEach(() => {
    mock('grpc-methods', { PublicError: {} })
    mock('./failed-to-create-order-error', {})

    errors = require('./index')
  })

  afterEach(() => {
    mock.stopAll()
  })

  describe('implementations', () => {
    it('PublicError', () => expect(errors.PublicError).to.be.implemented())
    it('FailedToCreateOrderError', () => expect(errors.FailedToCreateOrderError).to.be.implemented())
  })
})
