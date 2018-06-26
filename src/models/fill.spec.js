const { chai, sinon, mock } = require('test/test-helper')
const crypto = require('crypto')

const { expect } = chai

describe('Fill', () => {
  const safeid = sinon.stub().returns('fakeId')

  mock('generate-safe-id', safeid)

  const Fill = require('./fill')
  let hash
  let swapHash

  beforeEach(() => {
    hash = crypto.createHash('sha256')
    hash.update(Buffer.from('preimage', 'base64'))
    swapHash = hash.digest('base64')
  })

  afterEach(() => {
    safeid.resetHistory()
  })

  describe('#matchesHash', () => {
    it('returns true if the hashed preimage matches the swaphash', async () => {
      const fill = await Fill.create({
        order_id: 'asdf',
        fillAmount: 100,
        swapHash: swapHash,
        takerPayTo: 'ln:asdf'
      })

      const match = fill.matchesHash('preimage')

      expect(match).to.eql(true)
    })

    it('returns false if the hashed preimage matches the swaphash', async () => {
      const fill = await Fill.create({
        order_id: 'asdf',
        fillAmount: 100,
        swapHash: swapHash,
        takerPayTo: 'ln:asdf'
      })

      const match = fill.matchesHash('hello')

      expect(match).to.eql(false)
    })
  })
})
