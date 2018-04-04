const grpc = require('grpc');
const path = require('path');
const os = require('os');
const { readFileSync } = require('fs');

const { promisefy } = require('../utils');

const LND_HOME = os.platform() === 'darwin' ? 'Library/Application Support/Lnd/' : '.lnd/';
const LIGHTNING_URL = process.env.LND_URL || 'localhost:10009';
const TLS_PATH = process.env.TLS_PATH || path.resolve(os.homedir(), LND_HOME, 'tls.cert');
const MACAROON_PATH = process.env.MACAROON_PATH || path.resolve(os.homedir(), LND_HOME, 'admin.macaroon');
const PROTO_PATH = path.resolve('lnd-rpc.proto');
const PROTO_GRPC_TYPE = 'proto';
const PROTO_GRPC_OPTIONS = {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true,
};


// TODO: Need to add this cert info after we can start up a node on a container
//
//  Lnd cert is at ~/.lnd/tls.cert on Linux and
//  ~/Library/Application Support/Lnd/tls.cert on Mac

const lndCert = readFileSync(TLS_PATH);
const sslCreds = grpc.credentials.createSsl(lndCert);

const macaroonCreds = grpc.credentials.createFromMetadataGenerator((args, callback) => {
  const macaroon = readFileSync(MACAROON_PATH);
  const metadata = new grpc.Metadata();
  metadata.add('macaroon', macaroon.toString('hex'));
  callback(null, metadata);
});

const credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
const lnrpcDescriptor = grpc.load(PROTO_PATH, PROTO_GRPC_TYPE, PROTO_GRPC_OPTIONS);
const { lnrpc } = lnrpcDescriptor;


class LndEngine {
  constructor() {
    try {
      this.client = new lnrpc.Lightning(LIGHTNING_URL, credentials);
    } catch (e) {
      console.error('WARNING: LND Engine not implemented yet');
    }
  }

  async addInvoice(params) {
    return promisefy(params, this.client.addInvoice);
  }
}

module.exports = LndEngine;
