const { chai, sinon } = require('test/test-helper')
const { expect } = chai
const check = require('./check')

describe('check', () => {
  let responsesStub
  let healthCheckResponseStub

  healthCheckResponseStub = sinon.stub().callsFake((res) => res)
  responsesStub = { HealthCheckResponse: healthCheckResponseStub }

  it('returns the status', async () => {
    expect(await check({}, responsesStub)).to.eql({status: 'OK'})
  })
})
