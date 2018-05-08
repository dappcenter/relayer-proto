const KEY_NOT_FOUND = 'Public key not found'

/**
 * Gets the relayers public key from our Engine instances
 *
 * @return {Array<Error, Object>} response
 * @return {Array<Error, String>} error
 */
async function getPublicKey () {
  try {
    var info = await this.engine.getInfo()
    return [null, { publicKey: info.identityPubkey }]
  } catch (e) {
    return [e, KEY_NOT_FOUND]
  }
}

module.exports = getPublicKey
