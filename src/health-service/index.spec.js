const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')

const { expect } = chai

const HealthService = rewire(path.resolve(__dirname))

describe('HealthService', () => {
  let checkStub
  let GrpcUnaryMethod
  let register
  let fakeRegistered
  let loadProto
  let proto

  let protoPath
  let logger

  let server

  beforeEach(() => {
    protoPath = 'fakePath'
    proto = {
      HealthService: {
        service: 'fakeService'
      },
      HealthCheckResponse: sinon.stub()
    }
    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }

    GrpcUnaryMethod = sinon.stub()
    fakeRegistered = sinon.stub()
    register = sinon.stub().returns(fakeRegistered)
    GrpcUnaryMethod.prototype.register = register
    HealthService.__set__('GrpcUnaryMethod', GrpcUnaryMethod)

    loadProto = sinon.stub().returns(proto)
    HealthService.__set__('loadProto', loadProto)

    checkStub = sinon.stub()
    HealthService.__set__('check', checkStub)
  })

  beforeEach(() => {
    server = new HealthService(protoPath, { logger })
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
    expect(server.definition).to.be.equal(proto.HealthService.service)
  })

  it('creates a name', () => {
    expect(server).to.have.property('serviceName')
    expect(server.serviceName).to.be.a('string')
    expect(server.serviceName).to.be.eql('HealthService')
  })

  it('exposes an implementation', () => {
    expect(server).to.have.property('implementation')
    expect(server.implementation).to.be.an('object')
  })

  describe('#check', () => {
    let callOrder = 0
    let callArgs

    beforeEach(() => {
      callArgs = GrpcUnaryMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('check')
      expect(server.implementation.check).to.be.a('function')
    })

    it('creates a GrpcUnaryMethod', () => {
      expect(GrpcUnaryMethod).to.have.been.called()
      expect(GrpcUnaryMethod).to.have.been.calledWithNew()
      expect(server.implementation.check).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(checkStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[HealthService:check]')
    })

    describe('request options', () => {
      it('passes in the logger', () => {
        expect(callArgs[2]).to.have.property('logger')
        expect(callArgs[2].logger).to.be.equal(logger)
      })
      // other request options
    })

    it('passes in the responses', () => {
      expect(callArgs[3]).to.be.eql({ HealthCheckResponse: proto.HealthCheckResponse })
    })
  })
})
