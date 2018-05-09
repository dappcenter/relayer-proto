const { expect } = require('test/test-helper.spec')

const PublicError = require('./public-error')

describe('public-error', () => {
  let publicError
  let err
  let message

  beforeEach(() => {
    err = new Error('test error')
    message = 'Internal error'

    publicError = new PublicError(message, err)
  })

  it('inherits from Error', () => {
    expect(publicError).to.be.an('error')
  })

  it('is a PublicError', () => {
    expect(publicError.name).to.be.eql('PublicError')
  })

  it('throws an error if no message is provided', () => {
    expect(() => new PublicError()).to.throw()
  })

  it('sets a stack on the public error referencing the error argument', () => {
    expect(publicError.stack).to.eql(err.stack)
  })

  it('defaults to the caller stack if no error argument exists', () => {
    expect(new PublicError(message).stack).to.not.eql(err.stack)
  })
})
