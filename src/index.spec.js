const { expect, mock, sinon } = require('test/test-helper.spec')

describe('index', () => {
  let relayerStub
  let eventEmitter
  let logger
  let db
  let messageBox
  let marketEventPublisher
  let lndEngine

  beforeEach(() => {
    relayerStub = sinon.stub()
    eventEmitter = 'EventEmitter'
    logger = 'Logger'
    db = sinon.stub()
    messageBox = 'MessageBox'
    marketEventPublisher = 'MarketEventPublisher'
    lndEngine = {}

    mock('lnd-engine', lndEngine)
    mock('events', { EventEmitter: eventEmitter })
    mock('./utils', { logger, db })
    mock('./messaging', { MessageBox: messageBox })
    mock('./events', { MarketEventPublisher: marketEventPublisher })
    mock('./relayer', relayerStub)
  })

  afterEach(() => {
    mock.stopAll()
  })

  it('initializes the relayer', () => {
    require('./index')
    expect(relayerStub).to.have.been.calledWith(
      eventEmitter, lndEngine, messageBox, marketEventPublisher, logger, db
    )
  })
})
