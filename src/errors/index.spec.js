const { expect, mock } = require('test/test-helper.spec')

describe('errors index', () => {
  let errors

  beforeEach(() => {
    mock('./public-error', {})
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
