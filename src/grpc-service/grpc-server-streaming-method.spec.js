const path = require('path')
const { chai, rewire, sinon, delay } = require('test/test-helper')

const { expect } = chai

const GrpcServerStreamingMethod = rewire(path.resolve(__dirname, 'grpc-server-streaming-method'))

describe('GrpcServerStreamingMethod', () => {
  let method
  let requestOptions
  let call
  let GrpcMethod
  let logRequestStart
  let logRequestParams
  let logRequestEnd
  let logRequestCancel
  let logResponse
  let logError
  let grpcError
  let logger
  let responses
  let messageId

  beforeEach(() => {
    GrpcMethod = sinon.stub()
    GrpcServerStreamingMethod.__set__('GrpcMethod', GrpcMethod)

    logRequestStart = sinon.stub(GrpcServerStreamingMethod.prototype, 'logRequestStart')
    logRequestParams = sinon.stub(GrpcServerStreamingMethod.prototype, 'logRequestParams')
    logRequestEnd = sinon.stub(GrpcServerStreamingMethod.prototype, 'logRequestEnd')
    logRequestCancel = sinon.stub(GrpcServerStreamingMethod.prototype, 'logRequestCancel')
    logResponse = sinon.stub(GrpcServerStreamingMethod.prototype, 'logResponse')
    logError = sinon.stub(GrpcServerStreamingMethod.prototype, 'logError')
    grpcError = sinon.stub(GrpcServerStreamingMethod.prototype, 'grpcError')

    logger = {
      error: sinon.stub(),
      info: sinon.stub()
    }

    responses = {
      FakeResponse: sinon.stub()
    }

    messageId = '[FakeService:mymethod]'

    method = sinon.stub()
    requestOptions = {
      fake: 'option'
    }

    // TODO: is this actually what GRPC exposes?
    call = {
      request: 'fake request',
      write: sinon.stub(),
      end: sinon.stub(),
      destroy: sinon.stub(),
      on: sinon.stub()
    }
  })

  describe('#exec', () => {
    let grpcMethod

    beforeEach(() => {
      grpcMethod = new GrpcServerStreamingMethod(method, messageId, { logger, ...requestOptions }, responses)
    })

    it('logs the start of the request', () => {
      grpcMethod.exec(call)
      expect(logRequestStart).to.have.been.calledOnce()
      expect(logRequestStart).to.have.been.calledBefore(method)
    })

    it('logs request params', () => {
      grpcMethod.exec(call)
      expect(logRequestParams).to.have.been.calledOnce()
      expect(logRequestParams).to.have.been.calledBefore(method)
      expect(logRequestParams).to.have.been.calledWith(call.request)
    })

    it('calls the assigned method', () => {
      grpcMethod.exec(call)
      expect(method).to.have.been.calledOnce()
    })

    describe('request', () => {
      it('provides a request object to the method', () => {
        grpcMethod.exec(call)
        expect(method).to.have.been.calledWith(sinon.match.object)
      })

      it('provides the params of the call', () => {
        grpcMethod.exec(call)
        expect(method).to.have.been.calledWith(sinon.match({ params: call.request }))
      })

      it('provides a logger for the method', () => {
        grpcMethod.exec(call)
        expect(method).to.have.been.calledWith(sinon.match({ logger }))
      })

      it('includes the request options', () => {
        grpcMethod.exec(call)
        expect(method).to.have.been.calledWith(sinon.match(requestOptions))
      })

      it('includes a send function', () => {
        grpcMethod.exec(call)
        expect(method).to.have.been.calledWith(sinon.match({ send: sinon.match.func }))
      })

      it('binds the send function to the current context', () => {
        grpcMethod.send = sinon.stub()
        grpcMethod.exec(call)
        const request = method.args[0][0]
        request.send()
        expect(grpcMethod.send).to.have.been.calledOnce()
        expect(grpcMethod.send).to.have.been.calledOn(grpcMethod)
      })
    })

    it('provides the responses to the method', () => {
      grpcMethod.exec(call)
      expect(method).to.have.been.calledWith(sinon.match.any, sinon.match(responses))
    })

    describe('success', () => {
      beforeEach(() => {
        method.resolves()
      })

      it('logs the request end', async () => {
        await grpcMethod.exec(call)
        expect(logRequestEnd).to.have.been.calledOnce()
      })

      it('ends the server stream', async () => {
        await grpcMethod.exec(call)
        expect(call.end).to.have.been.calledOnce()
        expect(call.end).to.have.been.calledOn(call)
      })
    })

    describe('error', () => {
      describe('sync errors', () => {
        let fakeError

        beforeEach(() => {
          fakeError = new Error('fake')
          method.throws(fakeError)
        })

        it('logs errors when thrown', async () => {
          await grpcMethod.exec(call)

          expect(logError).to.have.been.calledOnce()
          expect(logError).to.have.been.calledWith(fakeError)
        })

        it('destroys the call', async () => {
          await grpcMethod.exec(call)

          expect(call.destroy).to.have.been.calledOnce()
        })

        it('sends the error with the destroy', async () => {
          const fakeFormatted = 'fake Error'
          grpcError.returns(fakeFormatted)

          await grpcMethod.exec(call)

          expect(grpcError).to.have.been.calledOnce()
          expect(grpcError).to.have.been.calledWith(fakeError)
          expect(call.destroy).to.have.been.calledOnce()
          expect(call.destroy).to.have.been.calledWith(fakeFormatted)
        })
      })

      describe('async errors', () => {
        let fakeError

        beforeEach(() => {
          fakeError = new Error('fake')
          method.rejects(fakeError)
        })

        it('logs errors when thrown', async () => {
          grpcMethod.exec(call)

          await delay(20)

          expect(logError).to.have.been.calledOnce()
          expect(logError).to.have.been.calledWith(fakeError)
        })

        it('destroys the call', async () => {
          grpcMethod.exec(call)

          await delay(20)

          expect(call.destroy).to.have.been.calledOnce()
        })

        it('sends the error with the destroy', async () => {
          const fakeFormatted = 'fake Error'
          grpcError.returns(fakeFormatted)

          grpcMethod.exec(call)

          await delay(20)

          expect(grpcError).to.have.been.calledOnce()
          expect(grpcError).to.have.been.calledWith(fakeError)
          expect(call.destroy).to.have.been.calledOnce()
          expect(call.destroy).to.have.been.calledWith(fakeFormatted)
        })
      })
    })

    describe('cancel', () => {
      beforeEach(() => {
        // want this promise to never resolve
        method.returns(new Promise(() => {}))
        call.on.callsFake(async (evt, cb) => {
          if (evt === 'cancelled') {
            await delay(20)
            cb()
          }
        })
      })

      it('logs on request cancel', async () => {
        grpcMethod.exec(call)

        await delay(20)

        expect(logRequestCancel).to.have.been.calledOnce()
      })

      it('logs request end on client cancel', async () => {
        grpcMethod.exec(call)

        await delay(20)

        expect(logRequestEnd).to.have.been.calledOnce()
      })
    })
  })

  describe('#send', () => {
    let grpcMethod

    beforeEach(() => {
      grpcMethod = new GrpcServerStreamingMethod(method, messageId, requestOptions)
    })

    it('logs data that is sent', () => {
      const fakeData = 'fake'
      grpcMethod.send(call, fakeData)

      expect(logResponse).to.have.been.calledOnce()
      expect(logResponse).to.have.been.calledWith(fakeData)
    })

    it('writes sent data to the server stream', () => {
      const fakeData = 'fake'
      grpcMethod.send(call, fakeData)

      expect(call.write).to.have.been.calledOnce()
      expect(call.write).to.have.been.calledWith(fakeData)
      expect(call.write).to.have.been.calledOn(call)
    })
  })
})
