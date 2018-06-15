/**
 * Given an order ID, open a stream for order fill notificaitons
 *
 * @param {GrpcServerStreamingMethod~request} request - request object
 * @param {Object} request.params - Request parameters from the client
 * @param {function} request.send - Send a chunk of data to the client
 * @param {function} request.onCancel - handler for if the client cancels
 * @param {function} request.onError - handler for if the stream errors
 * @param {Object} request.logger - logger for messages about the method
 * @param {EventEmitter} request.eventHandler - Event bus to put order messages onto
 * @param {MessageBox} request.messenger
 * @param {Object} responses
 * @param {function} responses.SubscribeFillResponse - constructor for SubscribeFillResponse messages
 * @return {void}
 */
const { Order, Fill } = require('../models')

async function subscribeFill ({ params, send, onCancel, onError, logger, eventHandler, messenger }, { SubscribeFillResponse }) {
  const { orderId } = params

  const order = await Order.findOne({ orderId })

  if (!order) {
    throw new Error(`No order with ID ${orderId}.`)
  }

  // TODO: ensure this user is authorized to connect to this order's stream

  /**
   * Return only the order status if it is in a cancelled state and close the stream
   */
  if (order.status === Order.STATUSES.CANCELLED) {
    send(new SubscribeFillResponse({
      orderStatus: order.status
    }))
    return
  }

  if (order.status !== Order.STATUSES.PLACED) {
    throw new Error(`Cannot setup a fill listener for order in ${order.status} status.`)
  }

  /**
   * When clients close the connection to subscribe fill we should cancel their orders to
   * prevent orphaned orders from staying alive.
   * @todo Cancel orders for which there is no stream opened every
   * @see {@link https://trello.com/c/Qc4cJ5Df/331-combine-placeorder-and-subscribefill}
   * @return {Promise} Resolves when the order is cancelled
   */
  async function earlyClose () {
    // TODO: do we need to check order status to make sure it hasn't been filled, etc ?
    logger.info(`Maker for order ${orderId} dropped the connection, cancelling order`)

    await order.cancel()

    eventHandler.emit('order:cancelled', order)
    // TODO: refund invoices
  }

  onCancel(earlyClose)
  onError(earlyClose)

  const fillId = await messenger.get(`fill:${order._id}`)
  const fill = await Fill.findOne({ fillId })

  // TODO: how to handle this? this is an error on the application side, not on the client side
  if (!fill || fill.status !== Fill.STATUSES.ACCEPTED) {
    throw new Error(`${fillId} is not a valid fill in the ${Fill.STATUSES.ACCEPTED} status.`)
  }

  send(new SubscribeFillResponse({
    orderStatus: order.status,
    fill: {
      swapHash: fill.swapHash,
      fillAmount: fill.fillAmount.toString()
    }
  }))

  eventHandler.emit('order:filled', order, fill)
}

module.exports = subscribeFill
