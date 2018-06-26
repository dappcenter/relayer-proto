const LndEngine = require('lnd-engine')

const LND_HOST = 'lnd_btc:10009'
const LND_TLS_CERT = '/shared/lnd-engine-tls.cert'
const LND_MACAROON = '/shared/lnd-engine-admin.macaroon'

const lnd = new LndEngine(LND_HOST, { logger: console, tlsCertPath: LND_TLS_CERT, macaroonPath: LND_MACAROON })

const args = process.argv.slice(2)
const [lndPublicKey, amount] = args

const invalidBalance = (n) => isNaN(parseFloat(n))

if (invalidBalance(amount)) throw new Error('Invalid amount specified for send-funds')

const amountInSat = (parseInt(amount) * 10000000)

lnd.client.sendCoins({ addr: lndPublicKey, amount: amountInSat }, (err, res) => {
  if (err) console.error(err)
  console.log(res)
})
