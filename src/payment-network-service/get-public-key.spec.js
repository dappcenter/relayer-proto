const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getPublicKeyPath = path.resolve('src', 'payment-network-service', 'get-public-key')
const getPublicKey = rewire(getPublicKeyPath)

describe('getPublicKey', () => {
  let engine
  let publicKey
  let response
  let GetPublicKeyResponse

  beforeEach(() => {
    publicKey = '12345'
    response = { identityPubkey: publicKey }
    engine = { getInfo: () => response }
    GetPublicKeyResponse = sinon.stub().returnsArg(0)
  })

  it('calls an engine to get public key info', async () => {
    const res = await getPublicKey({ engine }, { GetPublicKeyResponse })
    const expectedResponse = { publicKey: publicKey }
    expect(res).to.eql(expectedResponse)
  })

  describe('engine failure', () => {
    beforeEach(() => {
      engine = { getInfo: () => { throw new Error() } }
    })

    it('throws a key not found error if the engine call fails', async () => {
      const status = getPublicKey.__get__('KEY_NOT_FOUND')
      expect(getPublicKey({ engine }, { GetPublicKeyResponse })).to.be.rejectedWith(status)
    })
  })
})
