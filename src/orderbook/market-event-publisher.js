/**
 * Ingests events from elsewhere in the application, processes them into
 * Market Events, stores them and emits them for consumption
 *
 * @author kinesis
 */

const { MarketEvent } = require('../models')
const { promiseOnce } = require('../utils')

class MarketEventPublisher {
  constructor (emitter) {
    this.emitter = emitter
    this.markets = {}

    this.loadCurrentState()
    this.listenForEvents()
  }

  async eventsSince (marketName, lastUpdated) {
    return MarketEvent.find({
      createdAt: { $gt: new Date(lastUpdated) },
      marketName
    })
  }

  async getState (marketName) {
    if (!this.markets[marketName]) {
      this.markets[marketName] = []
    }

    if (!this._currentStateLoaded) {
      await promiseOnce(this.emitter, 'marketEvents:loaded')
    }

    return this.markets[marketName]
  }

  // Are we in danger of running out of memory here?
  addToState (event, force = false) {
    if (!this.markets[event.marketName]) {
      this.markets[event.marketName] = []
    }

    if (force || this._currentStateLoaded) {
      this.markets[event.marketName].push(event)
    } else {
      this._addBuffer.push(event)
    }
  }

  removeFromState (event, force = false) {
    if (force || this._currentStateLoaded) {
      // TODO: input checking here?
      // what if the event is not in here? Would we remove the last item in the last (index -1)?
      const index = this.markets[event.marketName].findIndex(ev => ev.orderId === event.orderId)
      this.markets[event.marketName].splice(index, 1)
    } else {
      this._removeBuffer.push(event)
    }
  }

  modifyState (event, force) {
    if (event.type === MarketEvent.TYPES.PLACED) {
      this.addToState(event, force)
    } else {
      this.removeFromState(event, force)
    }
  }

  // Do we need to wait for this to load before doing other things?
  loadCurrentState () {
    this._currentStateLoaded = false
    this._addBuffer = []
    this._removeBuffer = []
    const eventStream = MarketEvent.find().sort('timestamp').cursor()
    eventStream.on('data', event => this.modifyState(event))
    eventStream.on('end', () => {
      this._currentStateLoaded = true

      this._addBuffer.forEach(event => this.addToState(event))
      this._addBuffer = []
      this._removeBuffer.forEach(event => this.removeFromState(event))
      this._removeBuffer = []

      this.emitter.emit('marketEvents:loaded')
    })
  }

  listenForEvents () {
    this.emitter.on('order:placed', this._onPlaced.bind(this))
    this.emitter.on('order:cancelled', this._onCancelled.bind(this))
    this.emitter.on('order:filled', this._onFilled.bind(this))
  }

  emit (event) {
    this.emitter.emit(`market:${event.marketName}`, event)
  }

  publish (event) {
    this.modifyState(event)
    this.emit(event)
  }

  async _onPlaced (order) {
    const event = await MarketEvent.create({
      type: MarketEvent.TYPES.PLACED,
      orderId: order.orderId,
      marketName: order.marketName,
      payload: {
        baseAmount: order.baseAmount,
        counterAmount: order.counterAmount,
        side: order.side
      }
    })

    this.publish(event)
  }

  async _onCancelled (order) {
    const event = await MarketEvent.create({
      type: MarketEvent.TYPES.CANCELLED,
      orderId: order.orderId,
      marketName: order.marketName,
      payload: {}
    })

    this.publish(event)
  }

  async _onFilled (order, fill) {
    const event = await MarketEvent.create({
      type: MarketEvent.TYPES.FILLED,
      orderId: order.orderId,
      marketName: order.marketName,
      payload: { fillAmount: fill.fillAmount }
    })

    this.publish(event)
  }
}

module.exports = MarketEventPublisher
