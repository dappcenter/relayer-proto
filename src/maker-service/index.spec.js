const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')

const { expect } = chai

const MakerService = rewire(path.resolve(__dirname))

describe('MakerService', () => {
  let createOrderStub
  let placeOrderStub
  let subscribeFillStub
  let executeOrderStub
  let completeOrderStub
  let cancelOrderStub

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
      Maker: {
        service: 'fakeService'
      },
      CreateOrderResponse: sinon.stub(),
      PlaceOrderResponse: sinon.stub(),
      SubscribeFillResponse: sinon.stub(),
      ExecuteOrderResponse: sinon.stub(),
      CompleteOrderResponse: sinon.stub(),
      CancelOrderResponse: sinon.stub()
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
    MakerService.__set__('GrpcUnaryMethod', GrpcMethod)
    MakerService.__set__('GrpcServerStreamingMethod', GrpcMethod)

    loadProto = sinon.stub().returns(proto)
    MakerService.__set__('loadProto', loadProto)

    createOrderStub = sinon.stub()
    MakerService.__set__('createOrder', createOrderStub)
    placeOrderStub = sinon.stub()
    MakerService.__set__('placeOrder', placeOrderStub)
    subscribeFillStub = sinon.stub()
    MakerService.__set__('subscribeFill', subscribeFillStub)
    executeOrderStub = sinon.stub()
    MakerService.__set__('executeOrder', executeOrderStub)
    completeOrderStub = sinon.stub()
    MakerService.__set__('completeOrder', completeOrderStub)
    cancelOrderStub = sinon.stub()
    MakerService.__set__('cancelOrder', cancelOrderStub)
  })

  beforeEach(() => {
    server = new MakerService(protoPath, { logger, eventHandler, engine, messenger })
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
    expect(server.definition).to.be.equal(proto.Maker.service)
  })

  it('creates a name', () => {
    expect(server).to.have.property('serviceName')
    expect(server.serviceName).to.be.a('string')
    expect(server.serviceName).to.be.eql('Maker')
  })

  it('exposes an implementation', () => {
    expect(server).to.have.property('implementation')
    expect(server.implementation).to.be.an('object')
  })

  describe('#createOrder', () => {
    let callOrder = 0
    let callArgs

    beforeEach(() => {
      callArgs = GrpcMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('createOrder')
      expect(server.implementation.createOrder).to.be.a('function')
    })

    it('creates a GrpcMethod', () => {
      expect(GrpcMethod).to.have.been.called()
      expect(GrpcMethod).to.have.been.calledWithNew()
      expect(server.implementation.createOrder).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(createOrderStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[Maker:createOrder]')
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
      expect(callArgs[3]).to.be.eql({ CreateOrderResponse: proto.CreateOrderResponse })
    })
  })

  describe('#placeOrder', () => {
    let callOrder = 1
    let callArgs

    beforeEach(() => {
      callArgs = GrpcMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('placeOrder')
      expect(server.implementation.placeOrder).to.be.a('function')
    })

    it('creates a GrpcMethod', () => {
      expect(GrpcMethod).to.have.been.called()
      expect(GrpcMethod).to.have.been.calledWithNew()
      expect(server.implementation.placeOrder).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(placeOrderStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[Maker:placeOrder]')
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
    })

    it('passes in the response', () => {
      expect(callArgs[3]).to.be.eql({ PlaceOrderResponse: proto.PlaceOrderResponse })
    })
  })

  describe('#subscribeFill', () => {
    let callOrder = 2
    let callArgs

    beforeEach(() => {
      callArgs = GrpcMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('subscribeFill')
      expect(server.implementation.subscribeFill).to.be.a('function')
    })

    it('creates a GrpcMethod', () => {
      expect(GrpcMethod).to.have.been.called()
      expect(GrpcMethod).to.have.been.calledWithNew()
      expect(server.implementation.subscribeFill).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(subscribeFillStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[Maker:subscribeFill]')
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
      expect(callArgs[3]).to.be.eql({ SubscribeFillResponse: proto.SubscribeFillResponse })
    })
  })

  describe('#executeOrder', () => {
    let callOrder = 3
    let callArgs

    beforeEach(() => {
      callArgs = GrpcMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('executeOrder')
      expect(server.implementation.executeOrder).to.be.a('function')
    })

    it('creates a GrpcMethod', () => {
      expect(GrpcMethod).to.have.been.called()
      expect(GrpcMethod).to.have.been.calledWithNew()
      expect(server.implementation.executeOrder).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(executeOrderStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[Maker:executeOrder]')
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
      expect(callArgs[3]).to.be.eql({ ExecuteOrderResponse: proto.ExecuteOrderResponse })
    })
  })

  describe('#completeOrder', () => {
    let callOrder = 4
    let callArgs

    beforeEach(() => {
      callArgs = GrpcMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('completeOrder')
      expect(server.implementation.completeOrder).to.be.a('function')
    })

    it('creates a GrpcMethod', () => {
      expect(GrpcMethod).to.have.been.called()
      expect(GrpcMethod).to.have.been.calledWithNew()
      expect(server.implementation.completeOrder).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(completeOrderStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[Maker:completeOrder]')
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
    })

    it('passes in the response', () => {
      expect(callArgs[3]).to.be.eql({ CompleteOrderResponse: proto.CompleteOrderResponse })
    })
  })

  describe('#cancelOrder', () => {
    let callOrder = 5
    let callArgs

    beforeEach(() => {
      callArgs = GrpcMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('cancelOrder')
      expect(server.implementation.cancelOrder).to.be.a('function')
    })

    it('creates a GrpcMethod', () => {
      expect(GrpcMethod).to.have.been.called()
      expect(GrpcMethod).to.have.been.calledWithNew()
      expect(server.implementation.cancelOrder).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(cancelOrderStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[Maker:cancelOrder]')
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
    })

    it('passes in the response', () => {
      expect(callArgs[3]).to.be.eql({ CancelOrderResponse: proto.CancelOrderResponse })
    })
  })
})
