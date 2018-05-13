const path = require('path')
const { expect, rewire, sinon } = require('test/test-helper')

const { PublicError } = require('../errors')
const addImplementationsPath = path.resolve('src', 'grpc-utils', 'add-implementations')
const addImplementations = rewire(addImplementationsPath)

describe('add-implementations', () => {
  describe('prefix', () => {
    let prefix

    beforeEach(() => {
      prefix = addImplementations.__get__('prefix')
    })

    it('returns a log w/ a service prefix', () => {
      expect(prefix()).to.include('[Relayer]')
    })
  })

  describe('metadata', () => {
    let metadata
    let metadataStub
    let addSpy

    beforeEach(() => {
      addSpy = sinon.spy()
      metadataStub = sinon.stub()
      metadataStub.prototype.add = addSpy
      metadata = addImplementations.__get__('metadata')
      addImplementations.__set__('grpc', {
        Metadata: metadataStub,
        status: { INTERNAL: 1 }
      })
    })

    it('adds a service tag to metadata', () => {
      metadata()
      expect(addSpy).to.have.been.calledWith('service', 'Relayer')
    })

    it('adds a service tag timestamp', () => {
      metadata()
      expect(addSpy).to.have.been.calledWith('timestamp')
    })
  })

  describe('addImplementations', () => {
    let createImplementationSpy
    let revert

    beforeEach(() => {
      createImplementationSpy = sinon.spy()
      revert = addImplementations.__set__('createImplementation', createImplementationSpy)
    })

    afterEach(() => revert())

    it('returns a blank object by default', () => {
      expect(addImplementations()).to.eql({})
    })

    it('creates a gprc service implementation object', () => {
      const testImplementations = { test: () => {} }
      const testRelayer = sinon.stub()
      const res = addImplementations(testRelayer, testImplementations)

      expect(createImplementationSpy).to.have.been.calledOnce()
      expect(res).to.have.key('test')
    })
  })

  describe('createImplementation', () => {
    let createImplementation
    let func
    let funcName
    let relayer
    let logger

    beforeEach(() => {
      func = sinon.spy()
      funcName = 'testFunctionName'
      logger = {
        info: sinon.spy(),
        debug: sinon.spy(),
        error: sinon.spy()
      }
      relayer = { logger }

      createImplementation = addImplementations.__get__('createImplementation')
    })

    it('returns a function for a given method', () => {
      const res = createImplementation(relayer, func, funcName)
      expect(res).to.be.a('function')
    })

    describe('invoked implementation function', () => {
      let callStub
      let cbSpy
      let callRequest
      let res

      beforeEach(async () => {
        callRequest = {}
        callStub = { request: callRequest }
        cbSpy = sinon.spy()

        res = createImplementation(relayer, func, funcName)
        await res(callStub, cbSpy)
      })

      it('calls a specified function w/ grpc params', () => {
        expect(func).to.have.been.calledWith(callRequest, callStub)
      })

      it('returns a grpc response', () => {
        expect(cbSpy).to.have.been.calledOnce()
      })
    })

    describe('exceptions', () => {
      let callStub
      let cbSpy
      let callRequest
      let res

      beforeEach(async () => {
        callRequest = {}
        callStub = { request: callRequest }
        cbSpy = sinon.spy()
      })
      beforeEach(() => {
      })

      it('handles custom PublicErrors', async () => {
        const fakeError = 'TEST MESSAGE'
        func = sinon.stub().callsFake(() => { throw new PublicError(fakeError, new Error()) })
        res = createImplementation(relayer, func, funcName)
        await res(callStub, cbSpy)

        expect(cbSpy.getCall(0).args[0]).to.have.keys('code', 'message')
        expect(cbSpy.getCall(0).args[0].code).to.eql(1)
        expect(cbSpy.getCall(0).args[0].message).to.contain(fakeError)
      })

      it('throws a generic error for unhandled exceptions', async () => {
        func = sinon.stub().callsFake(() => { throw new Error() })
        res = createImplementation(relayer, func, funcName)
        await res(callStub, cbSpy)

        expect(cbSpy.getCall(0).args[0]).to.have.keys('code', 'message')
        expect(cbSpy.getCall(0).args[0].code).to.eql(1)
        expect(cbSpy.getCall(0).args[0].message).to.contain('Call terminated before completion')
      })
    })
  })
})
