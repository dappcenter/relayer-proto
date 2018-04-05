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

const orderSchema = new Schema({
  orderId: { type: String, unique: true, default: () => safeid() },
  // ownerId, in the case of LND, would be the user's LND public key
  ownerId: { type: String, required: true },
  side: { type: String, required: true, enum: MARKET_SIDES },
  baseAmount: { type: SchemaTypes.Long, required: true },
  baseSymbol: { type: String, required: true, maxlength: 3 },
  counterAmount: { type: SchemaTypes.Long, required: true },
  counterSymbol: { type: String, required: true, maxlength: 3 },
  fillAmount: { type: SchemaTypes.Long, required: false },
  swapHash: { type: String, required: false },
  swapPreimage: { type: String, required: false },
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