/**
 * Lib that loads our relayer-proto definition and provides the client to our
 * relayer
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
const PROTO = grpc.load(PROTO_PATH, PROTO_GRPC_TYPE, PROTO_GRPC_OPTIONS);
const KNOWN_SERVICES = {
  RELAYER_CLIENT: 'RelayerClient',
};


const relayer = {
  name: KNOWN_SERVICES.RELAYER_CLIENT,
  service: PROTO[KNOWN_SERVICES.RELAYER_CLIENT].service,
};

module.exports = { relayer };
