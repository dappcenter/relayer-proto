const check = require('./check')
const { chai, sinon } = require('test/test-helper.spec')
const { expect } = chai

describe('check', () => {
  let cbSpy
  cbSpy = sinon.spy()

  it('calls the cb with the correct args', () => {
    check(null, cbSpy)
    expect(cbSpy).calledWith(null, {status: 'SERVING'})
  })
})
