/**
 * Class representation of a fill
 *
 * @author kinesis
 */

const Enum = require('../utils/enum');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { Schema } = mongoose;
const { Types: SchemaTypes } = mongoose.Schema;
const STATUSES = new Enum(['CREATED', 'ACCEPTED']);

const fillSchema = new Schema({
  order_id: { type: String, index: true },
  ownerId: { type: String, required: true },
  fillAmount: { type: SchemaTypes.Long, required: false },
  swapHash: { type: String, required: false },
  swapPreimage: { type: String, required: false },
  status: { type: String, required: true, enum: STATUSES.values(), default: STATUSES.CREATED },
});

fillSchema.method({
  matchesHash(preimage) {
    if (!this.swapHash) {
      throw new Error('No swap hash exists for this fill.');
    }
    // TODO: make sure the preimage matches the hash
    return true;
  },
});

const Fill = mongoose.model('Fill', fillSchema);

module.exports = Fill;
