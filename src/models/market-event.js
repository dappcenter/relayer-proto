/**
 * Class representation of a Market Event
 *
 * @author kinesis
 */

const safeid = require('generate-safe-id');
const Enum = require('../utils/enum');
const { markets } = require('./market');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { Schema } = mongoose;
const EVENT_TYPES = new Enum(['PLACED', 'CANCELLED', 'FILLED']);
const MARKETS = new Enum(markets.map(market => market.name));

const marketEventSchema = new Schema({
  eventId: { type: String, required: true, unique: true, default: () => safeid() },
  marketName: { type: String, required: true, enum: Object.values(MARKETS) },
  orderId: { type: String, required: true },
  type: { type: String, required: true, enum: Object.values(EVENT_TYPES) },
  payload: { type: Object, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

marketEventSchema.method({
	serialize() {
      let message = {};

      Object.keys(this.payload).forEach((key) => {
        message[key] = this.payload[key].toString();
      });

      Object.assign(message, {
        eventId: this.eventId,
        orderId: this.orderId,
        eventType: this.type,
        timestamp: Math.round(this.createdAt.getTime() / 1000)
      });

      return message;
	}
})

const MarketEvent = mongoose.model('MarketEvent', marketEventSchema);

MarketEvent.TYPES = EVENT_TYPES;

module.exports = MarketEvent;
