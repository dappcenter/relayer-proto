const fs = require('fs')
const grpc = require('grpc')

const PROTO_FILE_TYPE = 'proto'
const PROTO_OPTIONS = {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true
}

/**
 * Loads a given proto file path into a grpc proto definition
 *
 * @param {String} protoPath
 * @return {grpc proto}
 * @throws {Error} proto does not exist
 */
function loadGrpc (protoPath) {
  if (!fs.existsSync(protoPath)) {
    throw new Error(`relayer.proto does not exist at ${protoPath}. please run 'npm run build'`)
  }

  return grpc.load(protoPath, PROTO_FILE_TYPE, PROTO_OPTIONS)
}

module.exports = loadGrpc
