const { expect, mock } = require('test/test-helper.spec')

describe('events index', () => {
  let events

  beforeEach(() => {
    mock('./market-event-publisher', {})

    events = require('./index')
  })

  afterEach(() => {
    mock.stopAll()
  })

  describe('implementations', () => {
    it('createFill', () => expect(events.MarketEventPublisher).to.be.implemented())
  })
})
