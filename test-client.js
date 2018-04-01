/**
 * Initializes a test client to use against our gRPC
 *
 * @author kinesis
 */

const grpc = require('grpc');
const path = require('path');

const PROTO_PATH = require.resolve('relayer-proto');
const PROTO_GRPC_TYPE = 'proto';
const PROTO_GRPC_OPTIONS = {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true,
};
const RELAYER_CLIENT_PROTO = grpc.load(PROTO_PATH, PROTO_GRPC_TYPE, PROTO_GRPC_OPTIONS);
const TEST_ADDRESS = process.env.GRPC_TEST_CLIENT_ADDRESS || '0.0.0.0:50078';

function testAction() {
  const client = new RELAYER_CLIENT_PROTO.RelayerClient(TEST_ADDRESS, grpc.credentials.createInsecure())
  return client.getOrders({
    baseSymbol: 'BTC',
    counterSymbol: 'LTC'
  }, (err, res) => {
    if (err) {
      console.error('Error when testing actions', err);
      throw(err);
    }

    return console.log(JSON.stringify(res, null, 2));
  });
}

testAction();
