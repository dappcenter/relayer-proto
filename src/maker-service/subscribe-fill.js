/**
 * Given an order ID, open a stream for order fill notificaitons
 *
 * @param {GrpcServerStreamingMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {function} request.send - Send a chunk of data to the client
 * @param {Object} request.logger - logger for messages about the method
 * @param {EventEmitter} request.eventHandler - Event bus to put order messages onto
 * @param {MessageBox} request.messenger
 * @param {Object} responses
 * @param {function} responses.SubscribeFillResponse - constructor for SubscribeFillResponse messages
 * @return {void}
 */
const { Order, Fill } = require('../models')

async function subscribeFill ({ params, send, logger, eventHandler, messenger }, { SubscribeFillResponse }) {
  const { orderId } = params

  const order = await Order.findOne({ orderId })

  if (!order) {
    throw new Error(`No order with ID ${orderId}.`)
  }

  /**
   * Return only the order status if it is in a cancelled state and close the stream
   */
  if (order.status === Order.STATUSES.CANCELLED) {
    send(new SubscribeFillResponse({
      orderStatus: order.status
    }))
    return
  }

  // TODO: ensure this user is authorized to connect to this order's stream

  if (order.status !== Order.STATUSES.PLACED) {
    throw new Error(`Cannot setup a fill listener for order in ${order.status} status.`)
  }

  // TODO: if they drop connection how do we make sure this listener doesn't get called
  const fillId = await messenger.get(`fill:${order._id}`)
  const fill = await Fill.findOne({ fillId })

  // TODO: how to handle this? this is an error on the application side, not on the client side
  if (!fill || fill.status !== Fill.STATUSES.ACCEPTED) {
    throw new Error(`${fillId} is not a valid fill in the ${Fill.STATUSES.ACCEPTED} status.`)
  }

  await order.fill()

  send(new SubscribeFillResponse({
    orderStatus: order.status,
    fill: {
      swapHash: fill.swapHash,
      fillAmount: fill.fillAmount
    }
  }))

  // TODO: this should probably be sent after the message is sent to the client
  eventHandler.emit('order:filled', order)
}

module.exports = subscribeFill
