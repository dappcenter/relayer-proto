const grpc = require('grpc');
const path = require('path');
const os = require('os');
const { readFileSync } = require('fs');

const { promisefy } = require('../utils');

const LIGHTNING_URL = process.env.LND_URL; // ex: my.lightning.com:10009
const TLS_PATH = process.env.TLS_PATH; // ex: ~/.lnd/tls.cert
const MACAROON_PATH = process.env.MACAROON_PATH; // ex: ~/.lnd/admin.macaroon

if (!LIGHTNING_URL || !TLS_PATH || !MACAROON_PATH) {
  throw new Error('Environment variables not set for `lnd-engine.js');
}

class LndEngine {
  constructor(logger) {
    this.logger = logger;

    // Create auth credentials w/ macaroon (decentralized token bearer specific to LND) and
    // w/ use of lnd ssl cert
    const macaroon = readFileSync(MACAROON_PATH);
    const metadata = new grpc.Metadata().add('macaroon', macaroon.toString('hex'));
    const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
      callback(null, metadata);
    });
    const lndCert = readFileSync(TLS_PATH);
    const sslCreds = grpc.credentials.createSsl(lndCert);
    const credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

    // Load lnd's rpc file and setup the Lightning service to be instantiated in
    // the lnd engine below
    const PROTO_PATH = path.resolve('lnd-rpc.proto');
    const PROTO_GRPC_TYPE = 'proto';
    const PROTO_GRPC_OPTIONS = {
      convertFieldsToCamelCase: true,
      binaryAsBase64: true,
      longsAsStrings: true,
    };
    const lnrpcDescriptor = grpc.load(PROTO_PATH, PROTO_GRPC_TYPE, PROTO_GRPC_OPTIONS);
    const { lnrpc:LndRpc } = lnrpcDescriptor;

    try {
      this.client = new lnrpc.Lightning(LIGHTNING_URL, credentials);
    } catch (e) {
      this.logger.error('WARNING: LND Engine not implemented yet', { error: e.toString() });
    }
  }

  /**
   *
   * @see lightning#addInvoice http://api.lightning.community/#addinvoice
   * @param {Object} params
   * @returns {Promise} addInvoice
   */
  async addInvoice(params) {
    return promisefy(params, this.client.addInvoice);
  }

  /**
   * TODO: We might want to take this logic out and abstract it into
   * an LND interface.
   */
  async getPayTo() {
    const info = await promisefy({}, this.client.getInfo);
    const pubKey = info.identityPubkey;
    return `ln:${pubKey}`;
  }
}

module.exports = LndEngine;
