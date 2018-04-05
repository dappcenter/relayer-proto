/**
 * Class representation of a fill
 *
 * @author kinesis
 */

const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { Schema } = mongoose;
const { Types: SchemaTypes } = mongoose.Schema;

const fillSchema = new Schema({
  orderId: { type: String, index: true },
  ownerId: { type: String, required: true },
  fillAmount: { type: SchemaTypes.Long, required: false },
  swapHash: { type: String, required: false },
  swapPreimage: { type: String, required: false },
});

module.exports = mongoose.model('Fill', fillSchema);
