const safeid = require('generate-safe-id')

const { Market } = require('../models')

/**
 * Stream of current state of order book and then will give you updates to the
 * order book.
 *
 * @param {Object} req request data
 * @param {grpc#call} call
 * @return {Void}
 */
async function watchMarket (req, call) {
  const { baseSymbol, counterSymbol, lastUpdated } = req
  const watcherId = safeid()

  this.logger.info('watchMarket: Received request to watch for market update', {
    baseSymbol,
    counterSymbol,
    lastUpdated,
    watcherId
  })

  const params = {
    baseSymbol: String(baseSymbol),
    counterSymbol: String(counterSymbol),
    lastUpdated: lastUpdated === '0' ? null : new Date(lastUpdated)
  }

  try {
    const market = Market.getByObject(params)

    let oldEvents

    // TODO: handle if this is really old, where we'd prefer to just send the current state
    if (params.lastUpdated) {
      this.logger.info('watchMarket: Sending all events since last update', {
        lastUpdated: params.lastUpdated,
        marketName: market.name,
        watcherId
      })

      oldEvents = await this.marketEventPublisher.eventsSince(market.name, params.lastUpdated)
    } else {
      this.logger.info('watchMarket: Sending entire current state of orderbook', {
        marketName: market.name,
        watcherId
      })

      oldEvents = await this.marketEventPublisher.getState(market.name)
    }

    oldEvents.forEach((event) => {
      call.write(event.serialize())
    })

    this.logger.info(`watchMarket: Wrote ${oldEvents.length} events as update`, {
      marketName: market.name,
      watcherId
    })

    this.eventHandler.on(`market:${market.name}`, (event) => {
      this.logger.info('watchMarket: Detected market event', {
        marketName: market.name,
        watcherId,
        eventId: event.eventId,
        eventType: event.type
      })

      call.write(event.serialize())

      this.logger.info('watchMarket: Wrote market event to listener stream', {
        watcherId,
        event: event.serialize()
      })
    })
  } catch (e) {
    // TODO: filter for user-friendly errors
    // send an error back. What is the gRPC way of doing that?
    this.logger.error('watchMarket: Encountered error when streaming market events', {
      message: e.message,
      stack: e.stack,
      watcherId
    })
    call.destroy(e)
  }
}

module.exports = watchMarket
