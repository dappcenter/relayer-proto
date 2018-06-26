/**
 * Class representation of a fill
 *
 * @author kinesis
 */

const safeid = require('generate-safe-id')
const mongoose = require('mongoose')
const crypto = require('crypto')
require('mongoose-long')(mongoose)

const { Schema } = mongoose
const { Types: SchemaTypes } = mongoose.Schema

const STATUSES = {
  CREATED: 'CREATED',
  ACCEPTED: 'ACCEPTED'
}

const fillSchema = new Schema({
  fillId: { type: String, unique: true, index: true, default: () => safeid() },
  order_id: { type: String, index: true },
  fillAmount: { type: SchemaTypes.Long, required: true },
  swapHash: { type: String, required: true },
  swapPreimage: { type: String, required: false },
  status: { type: String, required: true, enum: Object.values(STATUSES), default: STATUSES.CREATED },
  takerPayTo: {
    type: String,
    required: true,
    validate: {
      validator (v) {
        return v.startsWith('ln:')
      },
      message: '{VALUE} is not a valid payTo Address. Must start with a LN: prefix'
    }
  }
})

/**
 * We only want the relayer to be able to set an fillId on the model. If there
 * is ever an orderId passed into the schema, we will prevent the saving of the record
 */
fillSchema.pre('create', (next) => {
  if (this.fillId) {
    this.invalidate('fillId')
  }
  next()
})

fillSchema.method({
  accept () {
    if (this.status !== STATUSES.CREATED) {
      throw new Error(`Invalid Fill Status: ${this.status}.
        Fills must be in a ${STATUSES.CREATED} status in order to be accepted.`.replace(/\s+/g, ' '))
    }
    this.status = STATUSES.ACCEPTED
    return this.save()
  },
  matchesHash (preimage) {
    if (!this.swapHash) {
      throw new Error('No swap hash exists for this fill.')
    }
    const hash = crypto.createHash('sha256')
    hash.update(Buffer.from(preimage, 'base64'))
    return this.swapHash === hash.digest('base64')
  }
})

fillSchema.statics.STATUSES = STATUSES

const Fill = mongoose.model('Fill', fillSchema)

module.exports = Fill
