/**
 * Class representation of a Market Event
 *
 * @author kinesis
 */

const safeid = require('generate-safe-id');
const { markets } = require('./market');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { Schema } = mongoose;

const EVENT_TYPES = {
  PLACED: 'PLACED',
  CANCELLED: 'CANCELLED',
  FILLED: 'FILLED',
};

// TODO: Do we want to `toUpperCase` these names JIC?
const MARKETS = markets.reduce((obj, market) => {
  return { [market.name]: market.name }
}, {});

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

marketEventSchema.statics.TYPES = EVENT_TYPES;
marketEventSchema.statics.MARKETS = MARKETS;

const MarketEvent = mongoose.model('MarketEvent', marketEventSchema);


module.exports = MarketEvent;
