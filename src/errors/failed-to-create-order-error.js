const PublicError = require('./public-error')

class FailedToCreateOrderError extends PublicError {
  constructor (err) {
    super('Failed to create order. Please try again', err)
  }
}

module.exports = FailedToCreateOrderError
