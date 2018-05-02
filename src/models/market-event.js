/**
 * Class representation of a Market Event
 *
 * @author kinesis
 */

const safeid = require('generate-safe-id')
const { sequence } = require('../utils')
const { SUPPORTED_MARKETS } = require('./market')
const mongoose = require('mongoose')
require('mongoose-long')(mongoose)

const { Schema } = mongoose

const EVENT_TYPES = {
  PLACED: 'PLACED',
  CANCELLED: 'CANCELLED',
  FILLED: 'FILLED'
}

const marketEventSchema = new Schema({
  eventId: { type: String, required: true, unique: true, default: () => safeid() },
  marketName: { type: String, required: true, enum: Object.values(SUPPORTED_MARKETS) },
  orderId: { type: String, required: true },
  type: { type: String, required: true, enum: Object.values(EVENT_TYPES) },
  payload: { type: Object, required: true },
  timestamp: { type: Number, required: true, default: () => (new Date()).getTime() },
  sequence: { type: Number, required: true, default: () => sequence() }
})

marketEventSchema.method({
  serialize () {
    const message = Object.keys(this.payload).reduce((acc, key) => {
      acc[key] = this.payload[key].toString()
      return acc
    }, {})

    Object.assign(message, {
      eventId: this.eventId,
      orderId: this.orderId,
      eventType: this.type,
      timestamp: this.timestamp,
      sequence: this.sequence
    })

    return message
  }
})

marketEventSchema.statics.TYPES = EVENT_TYPES
marketEventSchema.statics.MARKETS = SUPPORTED_MARKETS

const MarketEvent = mongoose.model('MarketEvent', marketEventSchema)

module.exports = MarketEvent
