const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const getPublicKey = rewire(path.resolve(__dirname, 'get-public-key'))

describe('getPublicKey', () => {
  let engine
  let publicKey
  let GetPublicKeyResponse
  let publicKeyStub

  beforeEach(() => {
    publicKey = '12345'
    publicKeyStub = sinon.stub().returns(publicKey)
    engine = { getPublicKey: publicKeyStub }
    GetPublicKeyResponse = sinon.stub().returnsArg(0)
  })

  it('calls an engine to get public key info', async () => {
    const res = await getPublicKey({ engine }, { GetPublicKeyResponse })
    const expectedResponse = { publicKey: publicKey }
    expect(publicKeyStub).to.have.been.calledOnce()
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
