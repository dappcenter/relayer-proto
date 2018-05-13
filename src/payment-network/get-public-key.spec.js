const path = require('path')
const { expect, rewire } = require('test/test-helper')

const getPublicKeyPath = path.resolve('src', 'payment-network', 'get-public-key')
const getPublicKey = rewire(getPublicKeyPath)

describe('getPublicKey', () => {
  let revert
  let engine
  let publicKey
  let response

  afterEach(() => {
    revert()
  })

  beforeEach(() => {
    publicKey = '12345'
    response = { identityPubkey: publicKey }
    engine = { getInfo: () => response }
    revert = getPublicKey.__set__('engine', engine)
  })

  it('calls an engine to get public key info', async () => {
    const res = await getPublicKey()
    const expectedResponse = [null, { publicKey: publicKey }]
    expect(res).to.eql(expectedResponse)
  })

  describe('engine failure', () => {
    beforeEach(() => {
      engine = { getInfo: () => { throw new Error() } }
      revert = getPublicKey.__set__('engine', engine)
    })

    it('throws a key not found error if the engine call fails', async () => {
      const res = await getPublicKey()
      const status = getPublicKey.__get__('KEY_NOT_FOUND')
      expect(res[1]).to.eql(status)
    })
  })
})
