const grpc = require('grpc');
const path = require('path');

const { promisefy } = require('../utils');

const LIGHTNING_URL = process.env.LND_URL || 'localhost:10009';

// TODO: Need to add this cert info after we can start up a node on a container
//
//  Lnd cert is at ~/.lnd/tls.cert on Linux and
//  ~/Library/Application Support/Lnd/tls.cert on Mac
// const fs = require('fs');
// const lndCert = fs.readFileSync('~/.lnd/tls.cert');
// const credentials = grpc.credentials.createSsl(lndCert);
//
const credentials = grpc.ServerCredentials.createInsecure();
const lnrpcDescriptor = grpc.load(path.resolve('lnd-rpc.proto'));
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
