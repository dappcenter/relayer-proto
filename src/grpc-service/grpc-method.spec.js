const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')

const { expect } = chai

const GrpcMethod = rewire(path.resolve(__dirname, 'grpc-method'))

describe('GrpcMethod', () => {
  let grpcMetadata
  let grpcMetadataAdd
  let grpcStatus = {
    INTERNAL: 14
  }
  let PublicError
  let method
  let requestOptions
  let logger
  let responses
  let messageId

  beforeEach(() => {
    PublicError = sinon.stub()
    GrpcMethod.__set__('PublicError', PublicError)

    grpcMetadata = sinon.stub()
    grpcMetadataAdd = sinon.stub()
    grpcMetadata.prototype.add = grpcMetadataAdd
    GrpcMethod.__set__('grpc', {
      Metadata: grpcMetadata,
      status: grpcStatus
    })

    logger = sinon.stub()
    responses = {
      FakeResponse: sinon.stub()
    }
    messageId = '[FakeService:mymethod]'

    method = sinon.stub()
    requestOptions = {
      fake: 'opts'
    }
  })

  describe('new', () => {
    it('assigns the method', () => {
      const grpcMethod = new GrpcMethod(method, messageId, { logger, ...requestOptions }, responses)

      expect(grpcMethod).to.have.property('method')
      expect(grpcMethod.method).to.be.equal(method)
    })

    it('assigns the message id', () => {
      const grpcMethod = new GrpcMethod(method, messageId, { logger, ...requestOptions }, responses)

      expect(grpcMethod).to.have.property('messageId')
      expect(grpcMethod.messageId).to.be.equal(messageId)
    })

    it('aliases the service logger', () => {
      const grpcMethod = new GrpcMethod(method, messageId, { logger, ...requestOptions }, responses)

      expect(grpcMethod).to.have.property('logger')
      expect(grpcMethod.logger).to.be.equal(logger)
    })

    it('aliases the object of responses', () => {
      const grpcMethod = new GrpcMethod(method, messageId, { logger, ...requestOptions }, responses)

      expect(grpcMethod).to.have.property('responses')
      expect(grpcMethod.responses).to.be.equal(responses)
    })

    it('assigns the request options', () => {
      const grpcMethod = new GrpcMethod(method, messageId, { logger, ...requestOptions }, responses)

      expect(grpcMethod).to.have.property('requestOptions')
      expect(grpcMethod.requestOptions).to.be.eql(requestOptions)
    })
  })

  describe('#exec', () => {
    it('throws the unimplemented exec', () => {
      const grpcMethod = new GrpcMethod(method, messageId, { logger, ...requestOptions }, responses)

      expect(grpcMethod.exec).to.throw()
    })
  })

  describe('#register', () => {
    it('binds exec to the GrpcMethod context', () => {
      const grpcMethod = new GrpcMethod(method, messageId, { logger, ...requestOptions }, responses)

      grpcMethod.exec = sinon.stub()

      const bound = grpcMethod.register()

      bound()

      expect(grpcMethod.exec).to.have.been.calledOnce()
      expect(grpcMethod.exec).to.have.been.calledOn(grpcMethod)
    })
  })

  describe('#metatdata', () => {
    it('creates grpc metadata', () => {
      const grpcMethod = new GrpcMethod(method, messageId, { logger, ...requestOptions }, responses)

      const meta = grpcMethod.metadata()

      expect(meta).to.be.instanceof(grpcMetadata)
    })

    xit('adds a timestamp to the metadata')
  })

  describe('#grpcError', () => {
    it('creates a grpc-compliant error object', () => {
      const grpcMethod = new GrpcMethod(method, messageId, { logger, ...requestOptions }, responses)

      const err = new Error('fake error')
      const grpcErr = grpcMethod.grpcError(err)

      expect(grpcErr).to.be.a('object')
      expect(Object.keys(grpcErr)).to.have.lengthOf(2)
      expect(grpcErr).to.have.property('code')
      expect(grpcErr).to.have.property('message')
    })

    xit('marks errors as internal')

    xit('defaults the error message')

    xit('it uses the error message for public errors')
  })
})
