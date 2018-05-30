const { PublicError } = require('../errors')
const KEY_NOT_FOUND = 'Public key not found'

/**
 * Gets the relayers public key from our Engine instances
 *
 * @param {GrpcUnaryMethod~request} request - request object
 * @param {Object} request.engine - Lightning Network engine
 * @param {Object} responses
 * @param {function} responses.GetPublicKeyResponse - constructor for GetPublicKeyResponse messages
 * @return {responses.GetPublicKeyResponse}
 * @throws {PublicError} If no Identity info in engine
 */
async function getPublicKey ({ engine }, { GetPublicKeyResponse }) {
  try {
    const publicKey = await engine.getPublicKey()
    return new GetPublicKeyResponse({ publicKey })
  } catch (e) {
    throw new PublicError(e, KEY_NOT_FOUND)
  }
}

module.exports = getPublicKey
