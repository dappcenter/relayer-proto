/**
 * Error class used for identifying errors that can be exposed to the client through
 * grpc
 */
class PublicError extends Error {
  /**
   * @param {String} message
   * @param {Error} err
   * @throws {Error} no message provided
   * @throws {Error} no error provided
   */
  constructor (message, err) {
    if (!message) throw new Error('No message provided for public error')

    super(message)
    this.name = this.constructor.name

    if (err) this.stack = err.stack
  }
}

module.exports = PublicError
