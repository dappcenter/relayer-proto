/**
 * Kinesis test helper
 *
 * NOTE: This file is specifically loaded before all tests so that we
 * can globally require some files.
 *
 */
const sinon = require('sinon')
const chai = require('chai')
const mock = require('mock-require')
const dirtyChai = require('dirty-chai')
const sinonChai = require('sinon-chai')

chai.use(dirtyChai)
chai.use(sinonChai)

beforeEach(function () {
  this.sandbox = sinon.sandbox.create()
})

afterEach(function () {
  this.sandbox.restore()
})

module.exports = {
  chai,
  sinon,
  mock
}
