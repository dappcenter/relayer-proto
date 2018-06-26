const { chai, sinon, mock } = require('test/test-helper')
const { expect } = chai

describe('Fill', () => {
  const safeid = sinon.stub().returns('fakeId')

  mock('generate-safe-id', safeid)

  const Fill = require('./fill')

  afterEach(() => {
    safeid.resetHistory()
  })

  describe('#matchesHash', () => {
    it('returns true if the hashed preimage matches the swaphash', async () => {
      const fill = await Fill.create({
        order_id: 'asdf',
        fillAmount: 100,
        swapHash: 'CM9VlMahIx5kjlXHQ7lA9ponFrXg4ZC+QACukB26jzM=',
        takerPayTo: 'ln:asdf'
      })

      const match = fill.matchesHash('IzxHRP9Pk4gd/uUPAuzEqQ8J84SVThSx9X8HaDxZpqo=')

      expect(match).to.eql(true)
    })

    it('returns false if the hashed preimage matches the swaphash', async () => {
      const fill = await Fill.create({
        order_id: 'asdf',
        fillAmount: 100,
        swapHash: 'CM9VlMahIx5kjlXHQ7lA9ponFrXg4ZC+QACukB26jzM=',
        takerPayTo: 'ln:asdf'
      })

      const match = fill.matchesHash('hello')

      expect(match).to.eql(false)
    })
  })
})
