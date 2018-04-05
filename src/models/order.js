/**
 * Class representation of an order
 *
 * @author kinesis
 */

const safeid = require('generate-safe-id');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { Schema } = mongoose;
const { Types: SchemaTypes } = mongoose.Schema;
const MARKET_SIDES = ['ASK', 'BID'];
const ORDER_STATUSES = ['CREATED', 'PLACED', 'CANCELLED', 'FILLED', 'COMPLETED'];

const orderSchema = new Schema({
  orderId: { type: String, unique: true, index: true, default: () => safeid() },
  ownerId: { type: String, required: true },
  payTo: { type: String, required: true, validate: {
    validator: function (v) {
      return v.slice(0, 3) === 'ln:'
    },
    message: '{VALUE} is not a valid payTo Address'
  } },
  status: { type: String, required: true, enum: ORDER_STATUSES, default: 'CREATED' },
  side: { type: String, required: true, enum: MARKET_SIDES },
  baseAmount: { type: SchemaTypes.Long, required: true },
  baseSymbol: { type: String, required: true, maxlength: 3 },
  counterAmount: { type: SchemaTypes.Long, required: true },
  counterSymbol: { type: String, required: true, maxlength: 3 },
});

orderSchema.method({
  place() {
    if (this.status !== 'CREATED') {
      throw new Error(`Invalid Order Status: ${this.status}.
        Orders must be in a CREATED status in order to be placed.`.replace(/\s+/g, ' '));
    }
    this.status = 'PLACED';
    return this.save();
  },
  cancel() {
    if (!['CREATED', 'PLACED'].includes(this.status)) {
      throw new Error(`Invalid Order Status: ${this.status}.
        Orders must be in a CREATED or PLACED status in order to be cancelled.`.replace(/\s+/g, ' '));
    }
    this.status = 'CANCELLED';
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

module.exports = mongoose.model('Order', orderSchema);
