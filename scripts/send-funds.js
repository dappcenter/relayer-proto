const LndEngine = require('lnd-engine')

const LND_HOST = 'lnd_btc:10009'
const LND_TLS_CERT = '/shared/lnd-engine-tls.cert'
const LND_MACAROON = '/shared/lnd-engine-admin.macaroon'

const lnd = new LndEngine(LND_HOST, { logger: console, tlsCertPath: LND_TLS_CERT, macaroonPath: LND_MACAROON })

const args = process.argv.slice(2)
const [lndPublicKey] = args

console.log(lndPublicKey)

lnd.client.sendCoins({ addr: lndPublicKey, amount: 100000000 }, (err, res) => {
  if (err) console.error(err)
  console.log(res)
})
