/**
 * Implementation for Maker functionality for the RelayerClient gRPC service
 *
 * @author kinesis
 */

const MAKERS = new Map();

function makerEventHandler(msg, call) {
  if (!msg.orderId) {
    return this.eventHandler.emit('error', new Error('Message arrived with no order id'));
  }

  const { orderId } = msg;

  // this is a foolish way of doing things... should have some authoritative way to tell
  // who the stream belongs to
  if (!MAKERS.get(orderId)) {
    MAKERS.set(orderId) = call;
  }

  Object.keys(msg).forEach((key) => {
    const requestType = key.slice(-1 * 'Request'.length) === 'Request' ? key.slice(0, -1 * 'Request'.length) : null;

    if (requestType && msg[key] !== null) {
      this.eventHandler.emit(`request:${requestType}`, orderId, msg[key], this._streamCallback(call, orderId, requestType), call);
    }
  });

  return null;
}

function makerErrorHandler(err) {
  this.logger.error('An error occured during a stream call', { service: this.name, error: err });
}

function makerCleanUp(call) {
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
  call.on('data', (msg) => makerEventHandler(msg, call));
  call.on('error', makerErrorHandler);
  call.on('end', () => makerCleanUp(call));
}

module.exports = stream;
