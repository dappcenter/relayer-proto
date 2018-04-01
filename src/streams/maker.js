/**
 * Implementation for Maker functionality for the RelayerClient gRPC service
 *
 * @author kinesis
 */

const MAKERS = new Map();

function _streamCallback(call, orderId, responseType) {
  return (err, orderStatus, message) => {

  };
}

/**
 * Implements a stream for a particular client type
 *
 * TODO: Figure out a way to check for consistent order ids based off of UUID?
 * TODO: figure out what the importance of the orderid is (requirements)
 * TODO: figure out what other calls we need to handle in a bidirectional stream
 * @param {GRPC callback} call
 * @returns {void}
 */
async function stream(call) {
  this.call = call;

  call.on('data', (msg) => {
    // Validate the order id. Because of proto, an orderId must be set, but can be a blank string
    if (msg.orderId === '') {
      this.logger.error('Message arrived with no order id');
      return this.call.write('ERROR: Message arrived with no order id');
    }

    const { orderId } = msg;

    // this is a foolish way of doing things... should have some authoritative way to tell
    // who the stream belongs to
    if (!MAKERS.get(orderId)) {
      MAKERS.set({ [orderId]: call });
    }

    Object.keys(msg).forEach((key) => {
      const requestType = key.slice(-1 * 'Request'.length) === 'Request' ? key.slice(0, -1 * 'Request'.length) : null;

      if (requestType && msg[key] !== null) {
        this.logger.info('Starting a request', { requestType });
        // I dont like the idea of a callback here
        this.eventHandler.emit(`request:${requestType}`, orderId, msg[key], (err, status, message) => {
          if (err) {
            return this.call.write(`ERROR: request failed: ${requestType}`);
          }

          return this.call.write({
            orderId,
            orderStatus: status,
            // Message needs to go here and can be of the following types
            // 1. placeOrderResponse
            // 2. cancelOrderResponse
            // 3. executeOrderRequest
            // 4. completeOrderResponse
          });
        });
      }
    });
  });
}

module.exports = stream;
