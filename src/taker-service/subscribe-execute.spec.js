const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const { Big } = require('../utils')

const { expect } = chai

const subscribeExecute = rewire(path.resolve(__dirname, 'subscribe-execute'))

describe('subscribeExecute', () => {
  let params
  let send
  let messenger
  let SubscribeExecuteResponse
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

  beforeEach(() => {
    send = sinon.stub()
    SubscribeExecuteResponse = sinon.stub()

    order = { orderId: '2', _id: 'asfd', status: orderStatuses.FILLED, cancel: cancelOrderStub, payTo: 'ln:asdf1234', counterAmount: Big(1000), baseAmount: Big(100) }

    messenger = {
      get: sinon.stub().resolves(order.payTo)
    }

    cancelOrderStub = sinon.stub()
    fill = { fillId: '3', orderId: '2', order_id: 'asfd', status: fillStatuses.ACCEPTED, swapHash: '2309402394', fillAmount: '100' }

    params = { fillId: '3' }

    fillStub = {
      findOne: sinon.stub().resolves(fill),
      STATUSES: fillStatuses
    }
    subscribeExecute.__set__('Fill', fillStub)

    orderStub = {
      findOne: sinon.stub().resolves(order),
      STATUSES: orderStatuses
    }
    subscribeExecute.__set__('Order', orderStub)
  })

  it('finds the fill with the associated fill id', async () => {
    await subscribeExecute({ params, send, messenger }, { SubscribeExecuteResponse })

    expect(fillStub.findOne).to.have.been.calledOnce()
    expect(fillStub.findOne).to.have.been.calledWith(sinon.match.has('fillId', '3'))
  })

  it('throws an error if the fill does not exist', () => {
    fillStub.findOne.resolves()
    return expect(subscribeExecute({ params, send, messenger }, { SubscribeExecuteResponse })).to.eventually.rejectedWith('No fill with ID 3')
  })

  it('throws an error if the order does not exist', () => {
    orderStub.findOne.resolves()
    return expect(subscribeExecute({ params, send, messenger }, { SubscribeExecuteResponse })).to.eventually.rejectedWith('No order associated with Fill 3')
  })

  it('throws an error if the fill is not in an accepted status', () => {
    fill.status = fillStatuses.CREATED
    const errorMessage = `Cannot setup execution listener for fill in ${fill.status} status.`
    return expect(subscribeExecute({ params, send, messenger }, { SubscribeExecuteResponse })).to.eventually.rejectedWith(errorMessage)
  })

  it('throws an error if the order is not in an filled status', () => {
    order.status = orderStatuses.CANCELLED
    const errorMessage = `Cannot setup execution listener for order in ${order.status} status.`
    return expect(subscribeExecute({ params, send, messenger }, { SubscribeExecuteResponse })).to.eventually.rejectedWith(errorMessage)
  })

  it('gets the payTo address from the messenger', async () => {
    await subscribeExecute({ params, send, messenger }, { SubscribeExecuteResponse })

    expect(messenger.get).to.have.been.calledOnce()
    expect(messenger.get).to.have.been.calledWith('execute:asfd')
  })

  it('sends the response to the client', async () => {
    await subscribeExecute({ params, send, messenger }, { SubscribeExecuteResponse })

    expect(send).to.have.been.calledOnce()
    expect(SubscribeExecuteResponse).to.have.been.calledOnce()
    expect(SubscribeExecuteResponse).to.have.been.calledWithNew()
    expect(SubscribeExecuteResponse).to.have.been.calledWith({payTo: 'ln:asdf1234'})
    expect(send.args[0][0]).to.be.instanceOf(SubscribeExecuteResponse)
  })
})
