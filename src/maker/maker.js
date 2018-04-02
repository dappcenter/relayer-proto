/**
 * Implementation for Maker functionality for the RelayerClient gRPC service
 *
 * @author kinesis
 */

const safeid = require('generate-safe-id');

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
  // this is a foolish way of doing things... should have some authoritative way to tell
  // who the stream belongs to
  call.on('data', (msg) => {
    this.ownerId = safeid();

    // Validate the order id. Because of proto, an orderId must be set, but can be a blank string
    this.logger.info('Owner is making request', { requestId: this.ownerId });

    if (msg.orderId === '') {
      this.logger.error('Message arrived with no order id');
      return this.call.write('ERROR: Message arrived with no order id');
    }

    const { orderId } = msg;

    // Find a way to not have to parse all the keys for these actions
    // Im worried that the object can be overloaded (large request) and kill
    // the server or something
    Object.keys(msg).forEach((key) => {
      // This takes parses all keys in the object for the key that ends in 'Request'
      // then grabs the first portion of key.
      //
      // Example:
      // someSampleRequest -> someSample -> request:someSample
      const requestType = key.slice(-1 * 'Request'.length) === 'Request' ? key.slice(0, -1 * 'Request'.length) : null;

      if (requestType && msg[key] !== null) {
        this.logger.info('Starting a request', { requestType });
        // Maybe there is something we can do instead of passing a callback, so that we can actually
        // return a response from an event?
        this.eventHandler.emit(`request:${requestType}`, this.ownerId, orderId, msg[key]);

        this.eventHandler.once(`request:${requestType}:${this.ownerId}:done`, (err, ownerId, orderId, status, message) => {
          if (!this.ownerId === ownerId) {
            return this.logger.info('ignore event');
          }

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

      return null;
    });

    return null;
  });

  call.end('end', () => call.end());
}

module.exports = stream;
