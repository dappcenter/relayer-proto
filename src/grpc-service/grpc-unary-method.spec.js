const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')

const { expect } = chai

const GrpcUnaryMethod = rewire(path.resolve(__dirname, 'grpc-unary-method'))

describe('GrpcUnaryMethod', () => {
  let method
  let requestOptions
  let call
  let sendUnaryData
  let GrpcMethod
  let logRequestStart
  let logRequestParams
  let logRequestEnd
  let logResponse
  let logError
  let metadata
  let grpcError
  let logger
  let responses
  let messageId

  beforeEach(() => {
    GrpcMethod = sinon.stub()
    GrpcUnaryMethod.__set__('GrpcMethod', GrpcMethod)

    logRequestStart = sinon.stub(GrpcUnaryMethod.prototype, 'logRequestStart')
    logRequestParams = sinon.stub(GrpcUnaryMethod.prototype, 'logRequestParams')
    logRequestEnd = sinon.stub(GrpcUnaryMethod.prototype, 'logRequestEnd')
    logResponse = sinon.stub(GrpcUnaryMethod.prototype, 'logResponse')
    logError = sinon.stub(GrpcUnaryMethod.prototype, 'logError')
    metadata = sinon.stub(GrpcUnaryMethod.prototype, 'metadata')
    grpcError = sinon.stub(GrpcUnaryMethod.prototype, 'grpcError')

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

    call = {
      request: 'fake request'
    }
    sendUnaryData = sinon.stub()
  })

  describe('#exec', () => {
    let grpcMethod

    beforeEach(() => {
      grpcMethod = new GrpcUnaryMethod(method, messageId, { logger, ...requestOptions }, responses)
    })

    it('logs the start of the request', () => {
      grpcMethod.exec(call, sendUnaryData)
      expect(logRequestStart).to.have.been.calledOnce()
      expect(logRequestStart).to.have.been.calledBefore(method)
    })

    it('logs request params', () => {
      grpcMethod.exec(call, sendUnaryData)
      expect(logRequestParams).to.have.been.calledOnce()
      expect(logRequestParams).to.have.been.calledBefore(method)
      expect(logRequestParams).to.have.been.calledWith(call.request)
    })

    it('calls the assigned method', () => {
      grpcMethod.exec(call, sendUnaryData)
      expect(method).to.have.been.calledOnce()
    })

    describe('request', () => {
      let requestStub

      beforeEach(() => {
        requestStub = Object.assign({}, { params: call.request, logger }, requestOptions)
      })

      it('provides a request object to the method', () => {
        grpcMethod.exec(call, sendUnaryData)
        expect(method).to.have.been.calledWith(sinon.match(requestStub))
      })
    })

    it('provides the responses to the method', () => {
      grpcMethod.exec(call, sendUnaryData)
      expect(method).to.have.been.calledWith(sinon.match.any, sinon.match(responses))
    })

    describe('success', () => {
      let fakeResponse

      beforeEach(() => {
        fakeResponse = 'hello'
        method.resolves(fakeResponse)
      })

      it('logs successful response', async () => {
        await grpcMethod.exec(call, sendUnaryData)

        expect(logResponse).to.have.been.calledOnce()
        expect(logResponse).to.have.been.calledWith(fakeResponse)
      })

      it('sends the method output as unary data', async () => {
        await grpcMethod.exec(call, sendUnaryData)

        expect(sendUnaryData).to.have.been.calledOnce()
        expect(sendUnaryData).to.have.been.calledWith(null, fakeResponse)
      })

      it('sends metadata with the output', async () => {
        const fakeMetadata = 'goodbye'
        metadata.returns(fakeMetadata)

        await grpcMethod.exec(call, sendUnaryData)

        expect(sendUnaryData).to.have.been.calledOnce()
        expect(sendUnaryData.args[0][2]).to.be.equal(fakeMetadata)
      })
    })

    describe('fail', () => {
      let fakeError

      beforeEach(() => {
        fakeError = new Error('fake')
        method.rejects(fakeError)
      })

      it('logs errors', async () => {
        await grpcMethod.exec(call, sendUnaryData)

        expect(logError).to.have.been.calledOnce()
        expect(logError).to.have.been.calledWith(fakeError)
      })

      it('sends an error as unary data', async () => {
        const fakeFormatted = 'fake Error'
        grpcError.returns(fakeFormatted)

        await grpcMethod.exec(call, sendUnaryData)

        expect(grpcError).to.have.been.calledOnce()
        expect(grpcError).to.have.been.calledWith(fakeError)
        expect(sendUnaryData).to.have.been.calledOnce()
        expect(sendUnaryData).to.have.been.calledWith(fakeFormatted)
      })

      it('includes metadata with the error', async () => {
        const fakeMetadata = 'goodbye'
        metadata.returns(fakeMetadata)

        await grpcMethod.exec(call, sendUnaryData)

        expect(sendUnaryData).to.have.been.calledOnce()
        expect(sendUnaryData.args[0][2]).to.be.equal(fakeMetadata)
      })
    })

    it('logs on successful request end', async () => {
      method.rejects()

      await grpcMethod.exec(call, sendUnaryData)

      expect(logRequestEnd).to.have.been.calledOnce()
    })

    it('logs on failed request end', async () => {
      method.resolves()

      await grpcMethod.exec(call, sendUnaryData)

      expect(logRequestEnd).to.have.been.calledOnce()
    })
  })
})
