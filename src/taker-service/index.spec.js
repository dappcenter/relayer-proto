const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')

const { expect } = chai

const TakerService = rewire(path.resolve(__dirname))

describe('TakerService', () => {
  let createFillStub
  let fillOrderStub
  let subscribeExecuteStub

  let GrpcMethod
  let register
  let fakeRegistered
  let loadProto
  let proto

  let protoPath
  let logger

  let eventHandler
  let messenger
  let engine

  let server

  beforeEach(() => {
    protoPath = 'fakePath'
    proto = {
      TakerService: {
        service: 'fakeService'
      },
      CreateFillResponse: sinon.stub(),
      FillOrderResponse: sinon.stub(),
      SubscribeExecuteResponse: sinon.stub()
    }
    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }

    eventHandler = sinon.stub()
    messenger = sinon.stub()
    engine = sinon.stub()

    GrpcMethod = sinon.stub()
    fakeRegistered = sinon.stub()
    register = sinon.stub().returns(fakeRegistered)
    GrpcMethod.prototype.register = register
    TakerService.__set__('GrpcUnaryMethod', GrpcMethod)
    TakerService.__set__('GrpcServerStreamingMethod', GrpcMethod)

    loadProto = sinon.stub().returns(proto)
    TakerService.__set__('loadProto', loadProto)

    createFillStub = sinon.stub()
    TakerService.__set__('createFill', createFillStub)
    fillOrderStub = sinon.stub()
    TakerService.__set__('fillOrder', fillOrderStub)
    subscribeExecuteStub = sinon.stub()
    TakerService.__set__('subscribeExecute', subscribeExecuteStub)
  })

  beforeEach(() => {
    server = new TakerService(protoPath, { logger, eventHandler, engine, messenger })
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
    expect(server.definition).to.be.equal(proto.TakerService.service)
  })

  it('creates a name', () => {
    expect(server).to.have.property('serviceName')
    expect(server.serviceName).to.be.a('string')
    expect(server.serviceName).to.be.eql('TakerService')
  })

  it('exposes an implementation', () => {
    expect(server).to.have.property('implementation')
    expect(server.implementation).to.be.an('object')
  })

  describe('#createFill', () => {
    let callOrder = 0
    let callArgs

    beforeEach(() => {
      callArgs = GrpcMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('createFill')
      expect(server.implementation.createFill).to.be.a('function')
    })

    it('creates a GrpcMethod', () => {
      expect(GrpcMethod).to.have.been.called()
      expect(GrpcMethod).to.have.been.calledWithNew()
      expect(server.implementation.createFill).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(createFillStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[TakerService:createFill]')
    })

    describe('request options', () => {
      it('passes in the logger', () => {
        expect(callArgs[2]).to.have.property('logger')
        expect(callArgs[2].logger).to.be.equal(logger)
      })

      it('eventHandler', () => {
        expect(callArgs[2]).to.have.property('eventHandler')
        expect(callArgs[2].eventHandler).to.be.equal(eventHandler)
      })

      it('engine', () => {
        expect(callArgs[2]).to.have.property('engine')
        expect(callArgs[2].engine).to.be.equal(engine)
      })
    })

    it('passes in the response', () => {
      expect(callArgs[3]).to.be.eql({ CreateFillResponse: proto.CreateFillResponse })
    })
  })

  describe('#fillOrder', () => {
    let callOrder = 1
    let callArgs

    beforeEach(() => {
      callArgs = GrpcMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('fillOrder')
      expect(server.implementation.fillOrder).to.be.a('function')
    })

    it('creates a GrpcMethod', () => {
      expect(GrpcMethod).to.have.been.called()
      expect(GrpcMethod).to.have.been.calledWithNew()
      expect(server.implementation.fillOrder).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(fillOrderStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[TakerService:fillOrder]')
    })

    describe('request options', () => {
      it('passes in the logger', () => {
        expect(callArgs[2]).to.have.property('logger')
        expect(callArgs[2].logger).to.be.equal(logger)
      })

      it('eventHandler', () => {
        expect(callArgs[2]).to.have.property('eventHandler')
        expect(callArgs[2].eventHandler).to.be.equal(eventHandler)
      })

      it('messenger', () => {
        expect(callArgs[2]).to.have.property('messenger')
        expect(callArgs[2].messenger).to.be.equal(messenger)
      })

      it('engine', () => {
        expect(callArgs[2]).to.have.property('engine')
        expect(callArgs[2].engine).to.be.equal(engine)
      })
    })

    it('passes in the response', () => {
      expect(callArgs[3]).to.be.eql({ FillOrderResponse: proto.FillOrderResponse })
    })
  })

  describe('#subscribeExecute', () => {
    let callOrder = 2
    let callArgs

    beforeEach(() => {
      callArgs = GrpcMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('subscribeExecute')
      expect(server.implementation.subscribeExecute).to.be.a('function')
    })

    it('creates a GrpcMethod', () => {
      expect(GrpcMethod).to.have.been.called()
      expect(GrpcMethod).to.have.been.calledWithNew()
      expect(server.implementation.subscribeExecute).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(subscribeExecuteStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[TakerService:subscribeExecute]')
    })

    describe('request options', () => {
      it('passes in the logger', () => {
        expect(callArgs[2]).to.have.property('logger')
        expect(callArgs[2].logger).to.be.equal(logger)
      })

      it('eventHandler', () => {
        expect(callArgs[2]).to.have.property('eventHandler')
        expect(callArgs[2].eventHandler).to.be.equal(eventHandler)
      })

      it('messenger', () => {
        expect(callArgs[2]).to.have.property('messenger')
        expect(callArgs[2].messenger).to.be.equal(messenger)
      })
    })

    it('passes in the response', () => {
      expect(callArgs[3]).to.be.eql({ SubscribeExecuteResponse: proto.SubscribeExecuteResponse })
    })
  })
})
