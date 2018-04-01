/**
 * Initializes a test client to use against our gRPC
 *
 * @author kinesis
 */
const grpc = require('grpc');

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
  const client = new RELAYER_CLIENT_PROTO.RelayerClient(TEST_ADDRESS, grpc.credentials.createInsecure());
  const maker = client.maker();
  maker.write({
    orderId: '1234',
    placeOrderRequest: {
      order: {
        baseSymbol: 'BTC',
        counterSymbol: 'LTC',
        side: 'BID',
        baseAmount: '10000',
        counterAmount: '1000000',
      },
      payTo: 'ln:123455678',
    },
  });

  // Handle communication from the maker
  maker.on('data', msg => console.log(JSON.stringify(msg, null, 2)));
  maker.on('error', (msg) => {
    console.error('We need to handle the response codes here', msg.code);
    console.error(JSON.stringify(msg, null, 2))
  });
}

testAction();
