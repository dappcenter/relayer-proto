const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')

const { expect } = chai

const OrderBookService = rewire(path.resolve(__dirname))

describe('OrderBookService', () => {
  let watchMarketStub
  let GrpcServerStreamingMethod
  let register
  let fakeRegistered
  let loadProto
  let proto

  let protoPath
  let logger

  let eventHandler
  let marketEventPublisher

  let server

  beforeEach(() => {
    protoPath = 'fakePath'
    proto = {
      OrderBookService: {
        service: 'fakeService'
      },
      WatchMarketResponse: sinon.stub()
    }
    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }

    eventHandler = sinon.stub()
    marketEventPublisher = sinon.stub()

    GrpcServerStreamingMethod = sinon.stub()
    fakeRegistered = sinon.stub()
    register = sinon.stub().returns(fakeRegistered)
    GrpcServerStreamingMethod.prototype.register = register
    OrderBookService.__set__('GrpcServerStreamingMethod', GrpcServerStreamingMethod)

    loadProto = sinon.stub().returns(proto)
    OrderBookService.__set__('loadProto', loadProto)

    watchMarketStub = sinon.stub()
    OrderBookService.__set__('watchMarket', watchMarketStub)
  })

  beforeEach(() => {
    server = new OrderBookService(protoPath, { logger, eventHandler, marketEventPublisher })
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
    expect(server.definition).to.be.equal(proto.OrderBookService.service)
  })

  it('creates a name', () => {
    expect(server).to.have.property('serviceName')
    expect(server.serviceName).to.be.a('string')
    expect(server.serviceName).to.be.eql('OrderBookService')
  })

  it('exposes an implementation', () => {
    expect(server).to.have.property('implementation')
    expect(server.implementation).to.be.an('object')
  })

  describe('#watchMarket', () => {
    let callOrder = 0
    let callArgs

    beforeEach(() => {
      callArgs = GrpcServerStreamingMethod.args[callOrder]
    })

    it('exposes an implementation', () => {
      expect(server.implementation).to.have.property('watchMarket')
      expect(server.implementation.watchMarket).to.be.a('function')
    })

    it('creates a GrpcServerStreamingMethod', () => {
      expect(GrpcServerStreamingMethod).to.have.been.called()
      expect(GrpcServerStreamingMethod).to.have.been.calledWithNew()
      expect(server.implementation.watchMarket).to.be.equal(fakeRegistered)
    })

    it('provides the method', () => {
      expect(callArgs[0]).to.be.equal(watchMarketStub)
    })

    it('provides a message id', () => {
      expect(callArgs[1]).to.be.equal('[OrderBookService:watchMarket]')
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

      it('marketEventPublisher', () => {
        expect(callArgs[2]).to.have.property('marketEventPublisher')
        expect(callArgs[2].marketEventPublisher).to.be.equal(marketEventPublisher)
      })
    })

    it('passes in the response', () => {
      expect(callArgs[3]).to.be.eql({ WatchMarketResponse: proto.WatchMarketResponse })
    })
  })
})
