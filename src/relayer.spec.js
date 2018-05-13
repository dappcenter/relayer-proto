const path = require('path')
const { sinon, mock, rewire, expect } = require('test/test-helper')

const relayerPath = path.resolve('src', 'relayer')
const Relayer = rewire(relayerPath)

describe('relayer', () => {
  let loadProto
  let addImplementation
  let relayer
  let addServiceSpy
  let server
  let eventHandler
  let engine
  let messenger
  let publisher
  let logger
  let db

  beforeEach(() => {
    loadProto = {}
    addImplementation = {}

    eventHandler = sinon.stub()
    engine = sinon.stub()
    messenger = sinon.stub()
    publisher = sinon.stub()
    logger = {
      error: sinon.spy(),
      info: sinon.spy()
    }
    addServiceSpy = sinon.spy()
    db = sinon.spy()
    server = sinon.stub()
    server.prototype.addService = addServiceSpy
    server.prototype.bind = sinon.spy()
    server.prototype.start = sinon.spy()

    mock('./grpc-utils', { loadProto, addImplementation })
    mock('./maker', {})
    mock('./taker', {})
    mock('./payment-network', {})
    mock('./orderbook', {})

    Relayer.__set__('grpc', {
      Server: server,
      ServerCredentials: {
        createInsecure: () => {}
      }
    })
    Relayer.__set__('listen', () => {})

    relayer = new Relayer(eventHandler, engine, messenger, publisher, logger, db)
  })

  afterEach(() => {
    mock.stopAll()
  })

  it('logger', () => {
    expect(relayer.logger).to.eql(logger)
  })
  it('eventHandler', () => {})
  it('engine', () => {})
  it('messenger', () => {})
  it('marketEventPublisher', () => {})
  it('protoPath', () => {})
  it('proto', () => {})
  it('maker', () => {})
  it('taker', () => {})
  it('orderbook', () => {})
  it('paymentNetwork', () => {})
  it('server', () => {})
  it('call listen on a server', () => {})
  it('throws an error if relayer cannot be started', () => {})

  describe('host', () => {
    it('gets set from an env', () => {})
    it('default', () => {})
  })

  describe('service additions', () => {
    it('adds implementations for a maker', () => {})
    it('adds implementations for a taker', () => {})
    it('adds implementations for a paymentNetwork', () => {})
    it('adds implementations for a orderbook', () => {})
  })
})
