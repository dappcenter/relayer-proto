/**
 * Stream of current state of order book and then will give you updates to the
 * order book.
 *
 * Orders
 * .where(baseSymbol = baseSymbol)
 * .where(counterSymbol = counterSymbol)
 * .series('SELECT * FROM Orders WHERE orderId = orderId LIMIT 1)
 * .where('status === 'PLACED' OR status === 'FILLING')
 */

const safeid = require('generate-safe-id');
const bigInt = require('big-integer');
const { Market, MarketEvent } = require('../models');

async function watchMarket(call) {
  const { baseSymbol, counterSymbol, lastUpdated } = call.request;
  const watcherId = safeid();

  this.logger.info('watchMarket: Received request to watch for market update', {
    baseSymbol,
    counterSymbol,
    lastUpdated,
    watcherId
  });

  try {
    const market = Market.fromObject({ baseSymbol, counterSymbol });
    if(!markets.find(m => m.name === market.name)) {
      throw new Error(`Market ${market.name} is not supported.`);
    }

    if(lastUpdated) {
      // send all events since they last checked
      const events = await Market.find({
        createdAt: {
          $gt: new Date(lastUpdated)
        },
        marketName: market.name
      });

      events.forEach((event) => {
        call.write(event.writable());
      });
    } else {
      // send all current events
    }

    this.marketEventPublisher.on(`market:${market.name}`, (event) => {
      this.logger.info('Detected market event', {
        marketName: market.name,
        watcherId,
        eventId,
        eventType: event.type
      });

      call.write(event.writable());

      this.logger.info('Wrote market event to listener stream', {
        watcherId,
        event
      });
    });

  } catch (e) {
    // TODO: filter for user-friendly errors
    // send an error back. What is the gRPC way of doing that?
  }
}

module.exports = watchMarket;
