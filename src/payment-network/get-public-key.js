const { status } = require('grpc');

async function getPublicKey(call, cb) {
  const info = await this.engine.getInfo();
  const { identityPubkey } = info;

  if (!identityPubkey) {
    return cb({ message: `Fee Invoice for Order ${orderId} has not been paid`, code: status.INVALID_ARGUMENT });
  }

  return cb(null, { publicKey: identityPubkey });
}

module.exports = getPublicKey;
