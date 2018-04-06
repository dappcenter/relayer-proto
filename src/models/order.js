/**
 * Class representation of an order
 *
 * @author kinesis
 */

const safeid = require('generate-safe-id');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { Schema } = mongoose;
const { Types: SchemaTypes } = Schema;

const MARKET_SIDES = Object.freeze({
  ASK: 'ASK',
  BID: 'BID',
});

const STATUSES = Object.freeze({
  CREATED: 'CREATED',
  PLACED: 'PLACED',
  CANCELLED: 'CANCELLED',
  FILLED: 'FILLED',
  COMPLETED: 'COMPLETED',
});

const orderSchema = new Schema({
  orderId: { type: String, unique: true, index: true, default: () => safeid() },
  ownerId: { type: String, required: true },
  payTo: {
    type: String,
    required: true,
    validate: {
      validator(v) {
        return v.startsWith('ln:');
      },
      message: '{VALUE} is not a valid payTo Address',
    },
  },
  status: { type: String, required: true, enum: STATUSES.values(), default: STATUSES.CREATED },
  side: { type: String, required: true, enum: MARKET_SIDES.values() },
  baseAmount: { type: SchemaTypes.Long, required: true },
  baseSymbol: { type: String, required: true, maxlength: 3 },
  counterAmount: { type: SchemaTypes.Long, required: true },
  counterSymbol: { type: String, required: true, maxlength: 3 },
});

orderSchema.method({
  place() {
    if (this.status !== STATUSES.CREATED) {
      throw new Error(`Invalid Order Status: ${this.status}.
        Orders must be in a ${STATUSES.CREATED} status in order to be placed.`.replace(/\s+/g, ' '));
    }
    this.status = STATUSES.PLACED;
    return this.save();
  },
  cancel() {
    if (![STATUSES.CREATED, STATUSES.PLACED].includes(this.status)) {
      throw new Error(`Invalid Order Status: ${this.status}.
        Orders must be in a ${STATUSES.CREATED} or ${STATUSES.PLACED} status
        in order to be cancelled.`.replace(/\s+/g, ' '));
    }
    this.status = STATUSES.CANCELLED;
    return this.save();
  },
});

/**
 * We only want the relayer to be able to set an orderId on the model. If there
 * is ever an orderId passed into the schema, we will prevent the saving of the record
 */
orderSchema.pre('create', (next) => {
  if (this.orderId) {
    this.invalidate('orderId');
  }
  next();
});

orderSchema.virtual('STATUSES').get(() => STATUSES);
orderSchema.virtual('MARKET_SIDES').get(() => MARKET_SIDES);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
