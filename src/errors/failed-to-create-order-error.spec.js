const { expect } = require('test/test-helper.spec')

const PublicError = require('./public-error')
const FailedToCreateOrderError = require('./failed-to-create-order-error')

describe('public-error', () => {
  let createOrderError
  let err

  beforeEach(() => {
    err = new Error('test error')

    createOrderError = new FailedToCreateOrderError(err)
  })

  it('inherits from Error', () => {
    expect(createOrderError instanceof PublicError).to.be.true()
  })

  it('is a FailedToCreateOrderError', () => {
    expect(createOrderError.name).to.be.eql('FailedToCreateOrderError')
  })
})
