/**
 * Create a channel manually.
 *
 * NOTE: This scripts usage is meant specifically for bash
 *
 * Example: node create-channel-manually.js <host-address> <public-key> [optional-balance]`
 */
const LndEngine = require('lnd-engine')

const LND_HOST = 'lnd_btc:10009'
const LND_TLS_CERT = '/shared/lnd-engine-tls.cert'
const LND_MACAROON = '/shared/lnd-engine-admin.macaroon'
const MAX_LND_BALANCE = 16777215

const args = process.argv.slice(2)
const [host, pubKey, balance = MAX_LND_BALANCE] = args

const invalidBalance = (n) => isNaN(parseFloat(n))

if (!host) throw new Error('[create-channel-manually] host is not specified')
if (!pubKey) throw new Error('[create-channel-manually] host is not specified')
if (invalidBalance(balance)) throw new Error('balance specified is not a valid number')

const lnd = new LndEngine(LND_HOST, { logger: console, tlsCertPath: LND_TLS_CERT, macaroonPath: LND_MACAROON })

lnd.createChannel(host, pubKey, balance)
