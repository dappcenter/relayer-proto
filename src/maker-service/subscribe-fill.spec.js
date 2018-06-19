const path = require('path')
const { chai, rewire, sinon, delay } = require('test/test-helper')
const { Big } = require('../utils')

const { expect } = chai

const subscribeFill = rewire(path.resolve(__dirname, 'subscribe-fill'))

describe('subscribeFill', () => {
  let params
  let logger
  let send
  let onCancel
  let onError
  let eventHandler
  let messenger
  let SubscribeFillResponse
  let metadata
  let order
  let fill
  let fillStub
  let orderStub
  let cancelOrderStub
  let orderStatuses = {
    CREATED: 'CREATED',
    PLACED: 'PLACED',
    CANCELLED: 'CANCELLED',
    FILLED: 'FILLED',
    COMPLETED: 'COMPLETED'
  }
  let fillStatuses = {
    CREATED: 'CREATED',
    ACCEPTED: 'ACCEPTED'
  }
  let fillId

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }
    send = sinon.stub()
    onCancel = sinon.stub()
    onError = sinon.stub()
    eventHandler = {
      emit: sinon.stub(),
      on: sinon.stub()
    }
    SubscribeFillResponse = sinon.stub()

    fillId = '3'

    messenger = {
      get: sinon.stub().resolves(fillId)
    }
    metadata = {}

    cancelOrderStub = sinon.stub()
    order = { orderId: '2', _id: 'asfd', status: orderStatuses.PLACED, cancel: cancelOrderStub, payTo: 'ln:asdf1234', counterAmount: Big(1000), baseAmount: Big(100) }
    fill = { fillId: '3', orderId: '2', order_id: 'asfd', status: fillStatuses.ACCEPTED, swapHash: '2309402394', fillAmount: '100' }

    params = { orderId: '2' }

    fillStub = {
      findOne: sinon.stub().resolves(fill),
      STATUSES: fillStatuses
    }
    subscribeFill.__set__('Fill', fillStub)

    orderStub = {
      findOne: sinon.stub().resolves(order),
      STATUSES: orderStatuses
    }
    subscribeFill.__set__('Order', orderStub)
  })

  it('finds the order with the associated order id', async () => {
    await subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })

    expect(orderStub.findOne).to.have.been.calledOnce()
    expect(orderStub.findOne).to.have.been.calledWith(sinon.match.has('orderId', '2'))
  })

  it('throws an error if the order does not exist', () => {
    orderStub.findOne.resolves()
    return expect(subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })).to.eventually.rejectedWith('No order with ID')
  })

  it('sends the order status back alone if the order is cancelled', async () => {
    order.status = orderStatuses.CANCELLED
    await subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })

    expect(send).to.have.been.calledOnce()
    expect(SubscribeFillResponse).to.have.been.calledOnce()
    expect(SubscribeFillResponse).to.have.been.calledWithNew()
    expect(SubscribeFillResponse).to.have.been.calledWith({ orderStatus: orderStatuses.CANCELLED })
    expect(send.args[0][0]).to.be.instanceOf(SubscribeFillResponse)
  })

  it('throws an error if the order is not in a placed state', () => {
    order.status = orderStatuses.CREATED
    return expect(subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })).to.eventually.rejectedWith('Cannot setup a fill listener for order in')
  })

  it('waits for the messenger to return', async () => {
    await subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })

    expect(messenger.get).to.have.been.calledOnce()
    expect(messenger.get).to.have.been.calledWith('fill:asfd')
  })

  it('finds the fill', async () => {
    await subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })

    expect(fillStub.findOne).to.have.been.calledOnce()
    expect(fillStub.findOne).to.have.been.calledWith(sinon.match.has('fillId', '3'))
  })

  it('throws if the fill does not exist', () => {
    fillStub.findOne.resolves()
    return expect(subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })).to.eventually.rejectedWith('is not a valid fill')
  })

  it('throws if the fill is in a bad state', () => {
    fill.status = fillStatuses.CREATED
    return expect(subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })).to.eventually.rejectedWith('is not a valid fill')
  })

  it('sends the response to the client', async () => {
    await subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })

    expect(send).to.have.been.calledOnce()
    expect(SubscribeFillResponse).to.have.been.calledOnce()
    expect(SubscribeFillResponse).to.have.been.calledWithNew()
    expect(SubscribeFillResponse).to.have.been.calledWith({
      orderStatus: orderStatuses.PLACED,
      fill: {
        swapHash: fill.swapHash,
        fillAmount: fill.fillAmount
      }
    })
    expect(send.args[0][0]).to.be.instanceOf(SubscribeFillResponse)
  })

  it('emits the fill event', async () => {
    await subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })

    expect(eventHandler.emit).to.have.been.calledOnce()
    expect(eventHandler.emit).to.have.been.calledWith('order:filled', order)
  })

  it('adds a listener for closed connections', async () => {
    messenger.get = sinon.stub().returns(new Promise(() => {}))

    subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })

    await delay(10)

    expect(onCancel).to.have.been.calledOnce()
    expect(onCancel).to.have.been.calledWith(sinon.match.func)
  })

  it('adds a listener for errored connections', async () => {
    messenger.get = sinon.stub().returns(new Promise(() => {}))

    subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })

    await delay(10)

    expect(onError).to.have.been.calledOnce()
    expect(onError).to.have.been.calledWith(sinon.match.func)
  })

  it('cancels orders with closed connections', async () => {
    messenger.get = sinon.stub().returns(new Promise(() => {}))

    subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })

    await delay(10)

    const cancelHandler = onCancel.args[0][0]

    await cancelHandler()

    expect(cancelOrderStub).to.have.been.calledOnce()
    expect(eventHandler.emit).to.have.been.calledOnce()
    expect(eventHandler.emit).to.have.been.calledWith('order:cancelled', order)
  })

  it('cancels orders on errored connections', async () => {
    messenger.get = sinon.stub().returns(new Promise(() => {}))

    subscribeFill({ params, send, onCancel, onError, logger, metadata, eventHandler, messenger }, { SubscribeFillResponse })

    await delay(10)

    const errorHandler = onCancel.args[0][0]

    await errorHandler()

    expect(cancelOrderStub).to.have.been.calledOnce()
    expect(eventHandler.emit).to.have.been.calledOnce()
    expect(eventHandler.emit).to.have.been.calledWith('order:cancelled', order)
  })
})
