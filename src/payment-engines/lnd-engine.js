const grpc = require('grpc');
const path = require('path');
const os = require('os');
const { readFileSync } = require('fs');

const { promisefy } = require('../utils');

// TODO: We need to figure out the path to the lnd container for this cert
// The cert is available on the lnd container at `~/.lnd/tls.cert`
//
const LND_HOME = 'lnd:~/.lnd/';
const LIGHTNING_URL = process.env.LND_URL || 'lnd:10009';
// TODO: Need to make sure TLS and MACAROON works for lnd container


class LndEngine {
  constructor(logger) {
    this.logger = logger;

    const TLS_PATH = process.env.TLS_PATH || path.resolve(os.homedir(), LND_HOME, 'tls.cert');
    const MACAROON_PATH = process.env.MACAROON_PATH || path.resolve(os.homedir(), LND_HOME, 'admin.macaroon');

    const PROTO_PATH = path.resolve('lnd-rpc.proto');
    const PROTO_GRPC_TYPE = 'proto';
    const PROTO_GRPC_OPTIONS = {
      convertFieldsToCamelCase: true,
      binaryAsBase64: true,
      longsAsStrings: true,
    };

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

    try {
      this.client = new lnrpc.Lightning(LIGHTNING_URL, credentials);
    } catch (e) {
      this.logger.error('WARNING: LND Engine not implemented yet');
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
