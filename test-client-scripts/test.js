const grpc = require('grpc');
const path = require('path');
const { readFileSync } = require('fs');

const LIGHTNING_URL = 'lnd_btc:10009'; // ex: my.lightning.com:10009
const TLS_PATH = '/secure/tls.cert';
const MACAROON_PATH = '/secure/admin.macaroon';


process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA';

// if (!LIGHTNING_URL || !TLS_PATH || !MACAROON_PATH) {
//   throw new Error('Environment variables not set for `lnd-engine.js');
// }


const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
  const macaroon = readFileSync(MACAROON_PATH);
  const metadata = new grpc.Metadata();
  metadata.add('macaroon', macaroon.toString('hex'));
  callback(null, metadata);
});

const lndCert = readFileSync(TLS_PATH);
const sslCreds = grpc.credentials.createSsl(lndCert);
const credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

// Load lnd's rpc file and setup the Lightning service to be instantiated in
// the lnd engine below
const PROTO_PATH = path.resolve('./proto/lnd-rpc.proto');
const PROTO_GRPC_TYPE = 'proto';
const PROTO_GRPC_OPTIONS = {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true,
};
const options = {
  'grpc.ssl_target_name_override': 'lnd_btc',
  'grpc.default_authority': 'lnd_btc',
};

const lnrpcDescriptor = grpc.load(PROTO_PATH, PROTO_GRPC_TYPE, PROTO_GRPC_OPTIONS);
const { lnrpc: LndRpc } = lnrpcDescriptor;
const dan = new LndRpc.Lightning(LIGHTNING_URL, credentials, options);

dan.getInfo({}, (err, obj) => {
  if (err) {
    console.log(err);
  }

  console.log(obj);
});
