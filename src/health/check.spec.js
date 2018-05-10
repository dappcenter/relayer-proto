const path = require('path')
const { chai, sinon, rewire } = require('test/test-helper.spec')
const { expect } = chai
const checkPath = path.resolve('src', 'health', 'check')
const check = rewire(checkPath)

describe('check', () => {
  let revert
  let protoStub
  let healthCheckResponseStub

  healthCheckResponseStub = sinon.stub().callsFake((res) => res)
  protoStub = { HealthCheckResponse: healthCheckResponseStub }
  revert = check.__set__('proto', protoStub)

  afterEach(() => {
    revert()
  })

  it('returns the status', async () => {
    expect(await check(null, null)).to.eql({status: 'OK'})
  })
})
