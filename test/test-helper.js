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

const { expect, Assertion } = chai

chai.use(dirtyChai)
chai.use(sinonChai)

let sandbox = sinon.createSandbox()

before(async () => {
  await mockgoose.prepareStorage()
  await mongoose.connect('mongodb://testdb')
})

after(async () => {
  // SEE: https://github.com/Mockgoose/Mockgoose/issues/71
  await mongoose.disconnect()
  let retval = new Promise(resolve => {
    mockgoose.mongodHelper.mongoBin.childProcess.on('exit', resolve)
  })
  mockgoose.mongodHelper.mongoBin.childProcess.kill('SIGTERM')
  await retval
})

afterEach(async function () {
  sandbox.restore()
  await mockgoose.helper.reset()
})

Assertion.addMethod('implemented', function () {
  this.assert(
    (this._obj !== null && this._obj !== undefined)
    , 'expected #{this} to be implemented (non null/undefined)'
    , 'expected #{this} to not be implemented (null/undefined)'
  )
})

module.exports = {
  chai,
  expect,
  sinon: sandbox,
  mock,
  rewire
}
