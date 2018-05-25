const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')

const { expect } = chai

const PaymentNetworkService = rewire(path.resolve(__dirname))

describe('PaymentNetworkService', () => {
  let getPublicKeyStub
  let GrpcUnaryMethod
  let register
  let fakeRegistered
  let loadProto
  let proto

  let protoPath
  let logger

  let engine

  let server

  beforeEach(() => {
    protoPath = 'fakePath'
    proto = {
      PaymentNetworkService: {
        service: 'fakeService'
      },
      GetPublicKeyResponse: sinon.stub()
    }
    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }

    engine = sinon.stub()

    GrpcUnaryMethod = sinon.stub()
    fakeRegistered = sinon.stub()
    register = sinon.stub().returns(fakeRegistered)
    GrpcUnaryMethod.prototype.register = register
    PaymentNetworkService.__set__('GrpcUnaryMethod', GrpcUnaryMethod)

    loadProto = sinon.stub().returns(proto)
    PaymentNetworkService.__set__('loadProto', loadProto)

    getPublicKeyStub = sinon.stub()
    PaymentNetworkService.__set__('getPublicKey', getPublicKeyStub)
  })

  beforeEach(() => {
    server = new PaymentNetworkService(protoPath, { logger, engine })
  })

  it('assigns a proto path', () => {
    expect(server).to.have.property('protoPath')
    expect(server.protoPath).to.be.equal(protoPath)
  })

  it('loads the proto', () => {
    expect(loadProto).to.have.been.calledOnce()
    expect(loadProto).to.have.been.calledWith(protoPath)
  })

  it('assigns the proto', () => {
    expect(server).to.have.property('proto')
    expect(server.proto).to.be.equal(proto)
  })

  it('assigns a logger', () => {
    expect(server).to.have.property('logger')
    expect(server.logger).to.be.equal(logger)
  })

  it('assigns the definition', () => {
    expect(server).to.have.property('definition')
    expect(server.definition).to.be.equal(proto.PaymentNetworkService.service)
  })

  it('creates a name', () => {
    expect(server).to.have.property('serviceName')
    expect(server.serviceName).to.be.a('string')
    expect(server.serviceName).to.be.eql('PaymentNetworkService')
  })

  it('exposes an implementation', () => {
    expect(server).to.have.property('implementation')
    expect(server.implementation).to.be.an('object')
  })

  describe('#getPublicKey', () => {
    let callOrder = 0
    let callArgs

    beforeEach(() => {
      callArgs = GrpcUnaryMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('getPublicKey')
      expect(server.implementation.getPublicKey).to.be.a('function')
    })

    it('creates a GrpcUnaryMethod', () => {
      expect(GrpcUnaryMethod).to.have.been.called()
      expect(GrpcUnaryMethod).to.have.been.calledWithNew()
      expect(server.implementation.getPublicKey).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(getPublicKeyStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[PaymentNetworkService:getPublicKey]')
    })

    describe('request options', () => {
      it('passes in the logger', () => {
        expect(callArgs[2]).to.have.property('logger')
        expect(callArgs[2].logger).to.be.equal(logger)
      })

      it('engine', () => {
        expect(callArgs[2]).to.have.property('engine')
        expect(callArgs[2].engine).to.be.equal(engine)
      })
    })

    it('passes in the response', () => {
      expect(callArgs[3]).to.be.eql({ GetPublicKeyResponse: proto.GetPublicKeyResponse })
    })
  })
})
