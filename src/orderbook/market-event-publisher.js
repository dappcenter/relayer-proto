/**
 * Ingests events from elsewhere in the application, processes them into
 * Market Events, stores them and emits them for consumption
 *
 * @author kinesis
 */

const { MarketEvent } = require('../models');

class MarketEventPublisher {
  constructor(emitter) {
    this.emitter = emitter;

    this.listenForEvents();
  }

  listenForEvents() {
    this.emitter.on('order:placed', this._onPlaced.bind(this));
    this.emitter.on('order:cancelled', this._onCancelled.bind(this));
    this.emitter.on('order:filled', this._onFilled.bind(this));
  }

  _emit(event) {
    this.emitter.emit(`market:${event.marketName}`, event);
  }

  async _onPlaced(order) {
    const event = await MarketEvent.create({
      type: MarketEvent.TYPES.PLACED,
      orderId: order.orderId,
      marketName: order.marketName,
      payload: {
        baseAmount: order.baseAmount,
        counterAmount: order.counterAmount,
        side: order.side
      }
    });

    this._emit(event);
  }

  async _onCancelled(order) {
    const event = await MarketEvent.create({
      type: MarketEvent.TYPES.CANCELLED,
      orderId: order.orderId,
      marketName: order.marketName,
      payload: {}
    });

    this._emit(event);
  }

  async _onFilled(order, fill) {
    const event = await MarketEvent.create({
      type: MarketEvent.TYPES.FILLED,
      orderId: order.orderId,
      marketName: order.marketName,
      payload: {
        fillAmount: fill.fillAmount
      }
    });

    this._emit(event);
  }
}

module.exports = MarketEventPublisher;
