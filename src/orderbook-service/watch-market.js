const { Market } = require('../models')
const neverResolve = new Promise(() => {})

/**
 * Stream of current state of order book and then will give you updates to the
 * order book.
 *
 * @param {GrpcServerStreamingMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {function} request.send - Send a chunk of data to the client
 * @param {Object} request.logger - logger for messages about the method
 * @param {MarketEventPublisher} request.marketEventPublisher
 * @param {EventEmitter} request.eventHandler - Event bus to put order messages onto
 * @param {Object} responses
 * @param {function} responses.WatchMarketResponse - constructor for WatchMarketResponse messages
 * @return {void}
 */
async function watchMarket ({ params, send, logger, marketEventPublisher, eventHandler }, { WatchMarketResponse }) {
  params = {
    baseSymbol: String(params.baseSymbol),
    counterSymbol: String(params.counterSymbol),
    lastUpdated: params.lastUpdated === '0' ? null : new Date(params.lastUpdated)
  }
  const market = Market.getByObject(params)

  let oldEvents

  // TODO: handle if this is really old, where we'd prefer to just send the current state
  if (params.lastUpdated) {
    logger.info('watchMarket: Sending all events since last update', {
      lastUpdated: params.lastUpdated,
      marketName: market.name
    })

    oldEvents = await marketEventPublisher.eventsSince(market.name, params.lastUpdated)
  } else {
    logger.info('watchMarket: Sending entire current state of orderbook', {
      marketName: market.name
    })

    oldEvents = await marketEventPublisher.getState(market.name)
  }

  oldEvents.forEach((event) => {
    send(new WatchMarketResponse({
      type: WatchMarketResponse.ResponseType.EXISTING_EVENT,
      marketEvent: event.serialize()
    }))
  })

  logger.info(`watchMarket: Wrote ${oldEvents.length} existing events as update`, {
    marketName: market.name
  })

  send(new WatchMarketResponse({
    type: WatchMarketResponse.ResponseType.EXISTING_EVENTS_DONE
  }))

  logger.info(`watchMarket: send EXISTING_EVENTS_DONE to notify client they are caught up`, {
    marketName: market.name
  })

  eventHandler.on(`market:${market.name}`, (event) => {
    logger.info('watchMarket: Detected market event', {
      marketName: market.name,
      eventId: event.eventId,
      eventType: event.type
    })

    send(new WatchMarketResponse({
      type: WatchMarketResponse.ResponseType.NEW_EVENT,
      marketEvent: event.serialize()
    }))

    logger.info('watchMarket: Wrote new market event to listener stream', {
      event: event.serialize()
    })
  })

  // We don't want to return execution context back to the method wrapper, as it will end the stream
  await neverResolve
}

module.exports = watchMarket
