const { expect } = require('test/test-helper')

const { PublicError } = require('grpc-methods')
const FailedToCreateFillError = require('./failed-to-create-fill-error')

describe('FailedToCreateFillError', () => {
  let createFillError
  let err

  beforeEach(() => {
    err = new Error('test error')

    createFillError = new FailedToCreateFillError(err)
  })

  it('inherits from PublicError', () => {
    expect(createFillError instanceof PublicError).to.be.true()
  })

  it('is a FailedToCreateFillError', () => {
    expect(createFillError.name).to.be.eql('FailedToCreateFillError')
  })
})
