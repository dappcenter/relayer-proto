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
  marketName: { type: String, required: true, enum: MARKETS.values() },
  orderId: { type: String, required: true },
  type: { type: String, required: true, enum: EVENT_TYPES.values() },
  payload: { type: Object, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

marketEventSchema.method({
	writable() {
      let message = Object.assign({}, this.payload);

      Object.assign(message, {
        eventId: this.eventId,
        orderId: this.orderId,
        eventType: this.type,
      });

      return message;
	}
})

const MarketEvent = mongoose.model('MarketEvent', marketEventSchema);

MarketEvent.TYPES = EVENT_TYPES;

module.exports = MarketEvent;
