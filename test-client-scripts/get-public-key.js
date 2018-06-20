const LndEngine = require('lnd-engine')

const { LND_HOST, LND_TLS_CERT, LND_MACAROON } = process.env

const lnd = new LndEngine(LND_HOST, { logger: console, tlsCertPath: LND_TLS_CERT, macaroonPath: LND_MACAROON })

lnd.getPublicKey()
  .then((res) => {
    console.log(`Public Key: ${res}`)
  })
  .catch(console.err)
