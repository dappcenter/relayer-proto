const LndEngine = require('lnd-engine')

const { LND_HOST, LND_TLS_CERT, LND_MACAROON } = process.env

const lnd = new LndEngine(LND_HOST, { logger: console, tlsCertPath: LND_TLS_CERT, macaroonPath: LND_MACAROON })

console.log(lnd.client)

lnd.client.getInfo({}, (_, res) => console.log(res))
lnd.client.listChannels({}, (_, res) => console.log(res))
lnd.client.listInvoices({}, (_, res) => console.log(res))
