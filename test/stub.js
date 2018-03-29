import grpc from 'grpc'
import path from 'path'
const DESCRIPTOR_PATH = path.join(__dirname, '..', 'src', 'relayer_client.proto')
const RELAYER_CLIENT_PROTO = grpc.load(DESCRIPTOR_PATH, 'proto', {
  convertFieldsToCamelCase: true,
  binaryAsBase64: true,
  longsAsStrings: true
})

function createStub(address) {
	return new RELAYER_CLIENT_PROTO.RelayerClient(address, grpc.credentials.createInsecure())
}

export default createStub