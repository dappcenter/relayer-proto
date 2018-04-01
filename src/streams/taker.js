/**
 * Implementation for Taker functionality for the RelayerClient gRPC service
 *
 * @author kinesis
 */


function _streamCallback(call, orderId, responseType) {
  return (err, orderStatus, message) => {
    if (err) {
      return call.emit('error', err);
    }

    if (responseType) {
      const response = { orderId };

      // This is hacky. Fills don't have statuses, but orders do.
      // Query whether orders need statuses.... the request/response is a better status anyway
      // Status is really only useful for subscriptions...
      // TODO
      if (orderStatus) {
        response.orderStatus = orderStatus;
      }

      response[`${responseType}Response`] = message;

      call.write(response);
    }

    return null;
  };
}

const TAKERS = new Map();

function takerEventHandler(msg, call) {
  if (!msg.orderId) {
    return this.eventHandler.emit('error', new Error('Message arrived with no order id'));
  }

  const { orderId } = msg;

  // this is a foolish way of doing things... should have some authoritative way to tell
  // who the stream belongs to
  if (TAKERS.get(orderId) === undefined) {
    TAKERS.set({ [orderId]: call });
  }

  Object.keys(msg).forEach((key) => {
    const requestType = key.slice(-1 * 'Request'.length) === 'Request' ? key.slice(0, -1 * 'Request'.length) : null;

    if (requestType && msg[key] !== null) {
      this.eventHandler.emit(`request:${requestType}`, orderId, msg[key], _streamCallback(call, orderId, requestType), call);
    }
  });

  return null;
}

function takerErrorHandler(err) {
  this.logger.error('An error occured during a stream call', { service: this.name, error: err });
}

function takerCleanUp(call) {
  call.end();
}

/**
 * Implements a stream for a particular client type
 *
 * TODO: Figure out a way to check for consistent order ids based off of UUID?
 * TODO: figure out what the importance of the orderid is (requirements)
 * @param {GRPC callback} call
 * @returns {void}
 */
async function stream(call) {
  call.on('data', (msg) => takerEventHandler(msg, call));
  call.on('error', takerErrorHandler);
  call.on('end', () => takerCleanUp(call));
}

module.exports = stream;
