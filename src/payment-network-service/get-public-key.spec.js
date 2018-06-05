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
    let status

    beforeEach(() => {
      status = getPublicKey.__get__('KEY_NOT_FOUND')
      engine = { getPublicKey: () => { throw new Error(status) } }
    })

    it('throws a key not found error if the engine call fails', async () => {
      return expect(getPublicKey({ engine }, { GetPublicKeyResponse })).to.be.rejectedWith(status)
    })
  })
})
