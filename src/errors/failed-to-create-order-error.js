const { PublicError } = require('grpc-methods')

class FailedToCreateOrderError extends PublicError {
  constructor (err) {
    super('Failed to create order. Please try again', err)
  }
}

module.exports = FailedToCreateOrderError
