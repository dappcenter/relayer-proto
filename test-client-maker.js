/**
 * Initializes a test client to use against our gRPC
 *
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
const maker = new proto.Maker(TEST_ADDRESS, grpc.credentials.createInsecure());

const order = {
  baseSymbol: 'BTC',
  counterSymbol: 'LTC',
  baseAmount: '10000',
  counterAmount: '1000000',
  payTo: 'ln:123455678',
};

maker.placeOrder(order, (err, res) => {
  if (err) {
    return console.error(err);
  }

  console.log(res);
});

const order2 = {
  baseSymbol: 'ETH',
  counterSymbol: 'LTC',
  baseAmount: '10000',
  counterAmount: '1000000',
  payTo: 'ln:123455678',
};

maker.placeOrder(order2, (err, res) => {
  if (err) {
    return console.error(err);
  }

  console.log(res);
});
