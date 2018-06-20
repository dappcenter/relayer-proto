const LndEngine = require('lnd-engine')

const { LND_HOST, LND_TLS_CERT, LND_MACAROON } = process.env

const lnd = new LndEngine(LND_HOST, { logger: console, tlsCertPath: LND_TLS_CERT, macaroonPath: LND_MACAROON })

lnd.client.listChannels({}, (_, { channels = [] }) => {
  channels.forEach(c => {
    const {
      active,
      remotePubkey,
      channelPoint,
      capacity,
      localBalance,
      remoteBalance,
      totalSatoshisSent,
      totalSatoshisReceived,
      numUpdates,
      chanId
    } = c

    lnd.client.getChanInfo({ chanId }, (_, res) => {
      console.log({
        active,
        remotePubkey,
        channelPoint,
        capacity,
        localBalance,
        remoteBalance,
        totalSatoshisSent,
        totalSatoshisReceived,
        numUpdates,
        ...res
      })
    })
  })
})
