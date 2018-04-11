const grpc = require('grpc');
const path = require('path');
const { readFileSync } = require('fs');

const { promisefy } = require('../utils');

// ex: /secure/tls.cert
// ex: /secure/admin.macaroon
// ex: https://my.lightning.com:10009
const { TLS_PATH, MACAROON_PATH, LND_URL: LIGHTNING_URL } = process.env;

if (!LIGHTNING_URL || !TLS_PATH || !MACAROON_PATH) {
  throw new Error('Environment variables not set for `lnd-engine.js');
}

class LndEngine {
  constructor(logger) {
    this.logger = logger;

    // Create auth credentials w/ macaroon (decentralized token bearer specific to LND) and
    // w/ use of lnd ssl cert
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
    const SERVICE_OPTIONS = {
      'grpc.ssl_target_name_override': 'lnd_btc',
      'grpc.default_authority': 'lnd_btc',
    };
    const lnrpcDescriptor = grpc.load(PROTO_PATH, PROTO_GRPC_TYPE, PROTO_GRPC_OPTIONS);
    const { lnrpc: LndRpc } = lnrpcDescriptor;

    try {
      this.client = new LndRpc.Lightning(LIGHTNING_URL, credentials, SERVICE_OPTIONS);
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
    return new Promise((resolve, reject) => {
      this.client.addInvoice(params, (err, res) => {
        if (err) {
          reject(err);
        }

        if (!res) {
          reject(new Error('Payload is blank'));
        }
        resolve(res);
      });
    });
  }

  /**
   * TODO: Might need to modify this call to except a parameter instead of grabbing
   * the relayer's payto
   */
  async getPayTo() {
    // TODO: Promisefy doesnt actually work for RPC calls because the method is triggered with
    // no params instead of being wrapped :(
    const info = await promisefy({}, this.client.getInfo);
    const pubKey = info.identityPubkey;
    return `ln:${pubKey}`;
  }
}

module.exports = LndEngine;
