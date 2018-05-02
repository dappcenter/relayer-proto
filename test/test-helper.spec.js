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
const rewire = require('rewire')
const { Mockgoose } = require('mockgoose')
const dirtyChai = require('dirty-chai')
const sinonChai = require('sinon-chai')
const mongoose = require('mongoose')
const mockgoose = new Mockgoose(mongoose)

chai.use(dirtyChai)
chai.use(sinonChai)

before(async () => {
  await mockgoose.prepareStorage()
  await mongoose.connect('mongodb://testdb')
})

after(async () => {
  // SEE: https://github.com/Mockgoose/Mockgoose/issues/71
  await mongoose.disconnect()
  mockgoose.mongodHelper.mongoBin.childProcess.kill('SIGTERM')
})

beforeEach(function () {
  this.sandbox = sinon.sandbox.create()
})

afterEach(async function () {
  this.sandbox.restore()
  await mockgoose.helper.reset()
})

module.exports = {
  chai,
  sinon,
  mock,
  rewire
}
