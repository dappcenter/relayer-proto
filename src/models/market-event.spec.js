const { chai, sinon, mock } = require('test/test-helper.spec')

const { expect } = chai

describe('MarketEvent', () => {
  const SUPPORTED_MARKETS = {
    'ABC/XYZ': 'ABC/XYZ'
  }
  const safeid = sinon.stub().returns('fakeId')
  const sequence = sinon.stub().returns(1000)

  mock('generate-safe-id', safeid)
  mock('../utils', {
    sequence
  })
  mock('./market', {
    SUPPORTED_MARKETS
  })

  const MarketEvent = require('./market-event')

  afterEach(() => {
    safeid.resetHistory()
    sequence.resetHistory()
  })

  after(() => {
    mock.stop('generate-safe-id')
    mock.stop('../utils')
    mock.stop('./market')
  })

  describe('#create', () => {
    it('generates an event id', async () => {
      const fakeId = 'safeid'
      safeid.returns(fakeId)
      const event = await MarketEvent.create({
        marketName: 'ABC/XYZ',
        orderId: 'asodfijasf',
        type: MarketEvent.TYPES.PLACED,
        payload: {}
      })

      expect(safeid).to.have.been.calledOnce()
      expect(event).to.have.property('eventId')
      expect(event.eventId).be.eql(fakeId)
    })

    it('generates a timestamp', async () => {
      const timestamp = (new Date()).getTime()
      const event = await MarketEvent.create({
        marketName: 'ABC/XYZ',
        orderId: 'asodfijasf',
        type: MarketEvent.TYPES.PLACED,
        payload: {}
      })

      expect(event).to.have.property('timestamp')
      expect(event.timestamp).to.be.a('number')
      expect(event.timestamp).to.be.gte(timestamp)
      expect(event.timestamp).to.be.lte(timestamp + 12000)
    })

    it('generates a sequence', async () => {
      const fakeSequence = 1000
      sequence.returns(fakeSequence)
      const event = await MarketEvent.create({
        marketName: 'ABC/XYZ',
        orderId: 'asodfijasf',
        type: MarketEvent.TYPES.PLACED,
        payload: {}
      })

      expect(sequence).to.have.been.calledOnce()
      expect(event).to.have.property('sequence')
      expect(event.sequence).to.be.a('number')
      expect(event.sequence).to.be.eql(fakeSequence)
    })
  })

  describe('#serialize', () => {
    it('serializes events into objects', async () => {
      const event = await MarketEvent.create({
        marketName: 'ABC/XYZ',
        orderId: 'asodfijasf',
        type: MarketEvent.TYPES.PLACED,
        payload: {}
      })

      const serialized = event.serialize()

      expect(serialized).to.be.a('object')
      expect(serialized).to.have.all.keys([
        'eventId',
        'orderId',
        'eventType',
        'timestamp',
        'sequence'
      ])
    })

    it('serializes the eventId', async () => {
      const fakeId = 'safeid'
      safeid.returns(fakeId)

      const event = await MarketEvent.create({
        marketName: 'ABC/XYZ',
        orderId: 'asodfijasf',
        type: MarketEvent.TYPES.PLACED,
        payload: {}
      })

      const serialized = event.serialize()

      expect(serialized).to.have.property('eventId')
      expect(serialized.eventId).to.be.eql(fakeId)
    })

    it('serializes the orderId', async () => {
      const fakeId = 'asodfijasf'

      const event = await MarketEvent.create({
        marketName: 'ABC/XYZ',
        orderId: fakeId,
        type: MarketEvent.TYPES.PLACED,
        payload: {}
      })

      const serialized = event.serialize()

      expect(serialized).to.have.property('orderId')
      expect(serialized.orderId).to.be.eql(fakeId)
    })

    it('serializes the eventType', async () => {
      const eventType = MarketEvent.TYPES.PLACED

      const event = await MarketEvent.create({
        marketName: 'ABC/XYZ',
        orderId: 'aosidjdfjoija',
        type: eventType,
        payload: {}
      })

      const serialized = event.serialize()

      expect(serialized).to.have.property('eventType')
      expect(serialized.eventType).to.be.eql(eventType)
    })

    it('serializes the timestamp', async () => {
      const timestamp = (new Date()).getTime()
      const event = await MarketEvent.create({
        marketName: 'ABC/XYZ',
        orderId: 'asodfijasf',
        type: MarketEvent.TYPES.PLACED,
        payload: {}
      })

      const serialized = event.serialize()

      expect(serialized).to.have.property('timestamp')
      expect(serialized.timestamp).to.be.a('number')
      expect(serialized.timestamp).to.be.gte(timestamp)
      expect(serialized.timestamp).to.be.lte(timestamp + 12000)
    })

    it('serializes the sequence', async () => {
      const fakeSequence = 1000
      sequence.returns(fakeSequence)

      const event = await MarketEvent.create({
        marketName: 'ABC/XYZ',
        orderId: 'asodfijasf',
        type: MarketEvent.TYPES.PLACED,
        payload: {}
      })

      const serialized = event.serialize()

      expect(serialized).to.have.property('sequence')
      expect(serialized.sequence).to.be.a('number')
      expect(serialized.sequence).to.be.eql(fakeSequence)
    })

    it('serializes a non-empty payload', async () => {
      const payload = {
        a: 'b'
      }

      const event = await MarketEvent.create({
        marketName: 'ABC/XYZ',
        orderId: 'asodfijasf',
        type: MarketEvent.TYPES.PLACED,
        payload
      })

      const serialized = event.serialize()

      expect(serialized).to.have.property('a')
      expect(serialized.a).to.be.a('string')
      expect(serialized.a).to.be.eql(payload.a)
    })

    it('serializes a non-string payloads into payloads', async () => {
      const payload = {
        a: 1
      }

      const event = await MarketEvent.create({
        marketName: 'ABC/XYZ',
        orderId: 'asodfijasf',
        type: MarketEvent.TYPES.PLACED,
        payload
      })

      const serialized = event.serialize()

      expect(serialized).to.have.property('a')
      expect(serialized.a).to.be.a('string')
      expect(serialized.a).to.be.eql(payload.a.toString())
    })
  })
})
