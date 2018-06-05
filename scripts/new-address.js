const LndEngine = require('lnd-engine')

const LND_HOST = 'lnd_btc:10009'
const LND_TLS_CERT = '/shared/lnd-engine-tls.cert'
const LND_MACAROON = '/shared/lnd-engine-admin.macaroon'

const lnd = new LndEngine(LND_HOST, { logger: console, tlsCertPath: LND_TLS_CERT, macaroonPath: LND_MACAROON })

lnd.client.newAddress({}, (_, res) => console.log(res.address))
