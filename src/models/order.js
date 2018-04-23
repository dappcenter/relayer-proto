/**
 * Class representation of an order
 *
 * @author kinesis
 */

const bigInt = require('big-integer')
const safeid = require('generate-safe-id')
const mongoose = require('mongoose')
require('mongoose-long')(mongoose)
const { SUPPORTED_MARKETS } = require('./market')

const { Schema } = mongoose
const { Types: SchemaTypes } = Schema

const MARKET_SIDES = Object.freeze({
  ASK: 'ASK',
  BID: 'BID'
})

const STATUSES = Object.freeze({
  CREATED: 'CREATED',
  PLACED: 'PLACED',
  CANCELLED: 'CANCELLED',
  FILLED: 'FILLED',
  COMPLETED: 'COMPLETED'
})

const orderSchema = new Schema({
  orderId: { type: String, unique: true, index: true, default: () => safeid() },
  ownerId: { type: String, required: true },
  payTo: {
    type: String,
    required: true,
    validate: {
      validator (v) {
        return v.startsWith('ln:')
      },
      message: '{VALUE} is not a valid payTo Address'
    }
  },
  status: { type: String, required: true, enum: Object.values(STATUSES), default: STATUSES.CREATED },
  side: { type: String, required: true, enum: Object.values(MARKET_SIDES) },
  marketName: { type: String, required: true, enum: Object.values(SUPPORTED_MARKETS) },
  baseAmount: { type: SchemaTypes.Long, required: true },
  counterAmount: { type: SchemaTypes.Long, required: true }
})

orderSchema.method({
  place () {
    if (this.status !== STATUSES.CREATED) {
      throw new Error(`Invalid Order Status: ${this.status}.
        Orders must be in a ${STATUSES.CREATED} status in order to be placed.`.replace(/\s+/g, ' '))
    }
    this.status = STATUSES.PLACED
    return this.save()
  },
  cancel () {
    if (![STATUSES.CREATED, STATUSES.PLACED].includes(this.status)) {
      throw new Error(`Invalid Order Status: ${this.status}.
        Orders must be in a ${STATUSES.CREATED} or ${STATUSES.PLACED} status
        in order to be cancelled.`.replace(/\s+/g, ' '))
    }
    this.status = STATUSES.CANCELLED
    return this.save()
  },
  fill () {
    if (this.status !== STATUSES.PLACED) {
      throw new Error(`Invalid Order Status: ${this.status}.
        Orders must be in a ${STATUSES.PLACED} status in order to be filled.`.replace(/\s+/g, ' '))
    }
    this.status = STATUSES.FILLED
    return this.save()
  },
  complete () {
    if (this.status !== STATUSES.FILLED) {
      throw new Error(`Invalid Order Status: ${this.status}.
        Orders must be in a ${STATUSES.FILLED} status in order to be completed.`.replace(/\s+/g, ' '))
    }
    this.status = STATUSES.COMPLETED
    return this.save()
  }
})

/**
 * We only want the relayer to be able to set an orderId on the model. If there
 * is ever an orderId passed into the schema, we will prevent the saving of the record
 */
orderSchema.pre('create', (next) => {
  if (this.orderId) {
    this.invalidate('orderId')
  }
  next()
})

orderSchema.virtual('base').get(() => bigInt(this.baseAmount))
orderSchema.virtual('counter').get(() => bigInt(this.counterAmount))

orderSchema.statics.STATUSES = STATUSES
orderSchema.statics.MARKET_SIDES = MARKET_SIDES

const Order = mongoose.model('Order', orderSchema)

module.exports = Order
