const { expect, mock, sinon } = require('test/test-helper.spec')

describe('index', () => {
  let relayerStub
  let eventEmitter
  let logger
  let messageBox
  let marketEventPublisher
  let lndEngine

  beforeEach(() => {
    relayerStub = sinon.stub()
    eventEmitter = 'EventEmitter'
    logger = 'Logger'
    messageBox = 'MessageBox'
    marketEventPublisher = 'MarketEventPublisher'
    lndEngine = {}

    mock('lnd-engine', lndEngine)
    mock('events', { EventEmitter: eventEmitter })
    mock('./utils', { logger })
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
      eventEmitter, lndEngine, messageBox, marketEventPublisher, logger
    )
  })
})
