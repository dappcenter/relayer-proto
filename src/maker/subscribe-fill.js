/**
 * Given an order ID, open a stream for order exection commands
 *
 * @param {Object} call, gRPC server-streaming call
 */

const { status } = require('grpc')

const { Order, Fill } = require('../models')

async function subscribeFill (call) {
  const { orderId } = call.request

  this.logger.info('subscribeFill: opening stream to listen for order fills', { orderId })

  try {
    const order = await Order.findOne({ orderId })

    if (!order) {
      throw new Error(`No order with ID ${orderId}.`)
    }

    // TODO: ensure this user is authorized to connect to this order's stream
    if (order.status !== Order.STATUSES.PLACED) {
      throw new Error(`Cannot setup a fill listener for order in ${order.status} status.`)
    }

    // TODO: if they drop connection how do we make sure this listener doesn't get called
    const fillId = await this.messenger.get(`fill:${order._id}`)
    const fill = await Fill.findOne({ fillId })

    // TODO: how to handle this? Should we hide these from the client?
    if (!fill) {
      throw new Error('No fill found.')
    }

    if (fill.status !== Fill.STATUSES.ACCEPTED) {
      throw new Error('Only accepted status are valid fills.')
    }
    await order.fill()

    call.write({
      swapHash: fill.swapHash,
      fillAmount: fill.fillAmount
    })

    call.end()

    this.eventHandler.emit('order:filled', order)
  } catch (e) {
    // TODO: filtering client friendly errors from internal errors
    this.logger.error('Invalid Order: Could not process', { error: e.toString() })
    call.emit({ message: e.message, code: status.INTERNAL })
    call.destroy()
  }
}

module.exports = subscribeFill
