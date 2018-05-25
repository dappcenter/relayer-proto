/**
 * Initializes a test client to use against our gRPC
 *
 * @author kinesis
 */
const grpc = require('grpc')
const path = require('path')

const PROTO_PATH = path.resolve('./proto/relayer.proto')
const PROTO_GRPC_TYPE = 'proto'
const PROTO_GRPC_OPTIONS = {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true
}
const TEST_ADDRESS = '0.0.0.0:28492'

const proto = grpc.load(PROTO_PATH, PROTO_GRPC_TYPE, PROTO_GRPC_OPTIONS)
const maker = new proto.PaymentNetwork(TEST_ADDRESS, grpc.credentials.createInsecure())

maker.getPublicKey({}, (err, res) => {
  if (err) return console.error(err)
  console.log('Public Key: ', res)
})
