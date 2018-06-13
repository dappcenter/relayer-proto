const { PublicError } = require('grpc-methods')

class FailedToCreateFillError extends PublicError {
  constructor (err) {
    super('Failed to create fill. Please try again', err)
  }
}

module.exports = FailedToCreateFillError
