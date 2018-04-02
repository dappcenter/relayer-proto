/**
 * Proof-of-concept work for client implementation of Get Orders
 *
 * TODO: This should be an action for maker/taker instead of its own thing
 * TODO: Remove getOrders callback in favor of writing data to the stream OK
 * @author kinesis
 */

const grpc = require('grpc');
const path = require('path');

const PROTO_PATH = path.resolve('relayer.proto');
const PROTO_GRPC_TYPE = 'proto';
const PROTO_GRPC_OPTIONS = {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true,
};
const TEST_ADDRESS = process.env.GRPC_TEST_CLIENT_ADDRESS || '0.0.0.0:50078';

const proto = grpc.load(PROTO_PATH, PROTO_GRPC_TYPE, PROTO_GRPC_OPTIONS);
const orderbook = new proto.OrderBook(TEST_ADDRESS, grpc.credentials.createInsecure());

function testAction() {
  const watch = orderbook.watch();
  watch.on('data', (res) => {
    console.log(res);
  });
  watch.on('error', err => console.error(err));
}

testAction();
