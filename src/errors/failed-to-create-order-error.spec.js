const { expect } = require('test/test-helper')

const { PublicError } = require('grpc-methods')
const FailedToCreateOrderError = require('./failed-to-create-order-error')

describe('failed-to-create-order-error', () => {
  let createOrderError
  let err

  beforeEach(() => {
    err = new Error('test error')

    createOrderError = new FailedToCreateOrderError(err)
  })

  it('inherits from PublicError', () => {
    expect(createOrderError instanceof PublicError).to.be.true()
  })

  it('is a FailedToCreateOrderError', () => {
    expect(createOrderError.name).to.be.eql('FailedToCreateOrderError')
  })
})
