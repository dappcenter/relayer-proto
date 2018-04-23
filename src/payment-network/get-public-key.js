const { status } = require('grpc')

async function getPublicKey (call, cb) {
  const info = await this.engine.getInfo()
  const { identityPubkey } = info

  if (!identityPubkey) {
    // eslint-disable-next-line
    return cb({ message: `Public Key not available`, code: status.INVALID_ARGUMENT })
  }

  return cb(null, { publicKey: identityPubkey })
}

module.exports = getPublicKey
