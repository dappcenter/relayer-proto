const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const { Big } = require('../utils')

const { expect } = chai

const executeOrder = rewire(path.resolve(__dirname, 'execute-order'))

describe('executeOrder', () => {
  let params
  let send
  let messenger
  let order
  let fill
  let logger
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
    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }
    order = { orderId: '2', _id: 'asfd', status: orderStatuses.FILLED, cancel: cancelOrderStub, payTo: 'ln:asdf1234', counterAmount: Big(1000), baseAmount: Big(100) }

    messenger = {
      set: sinon.stub().resolves()
    }

    cancelOrderStub = sinon.stub()
    fill = { fillId: '3', orderId: '2', order_id: 'asfd', status: fillStatuses.ACCEPTED, swapHash: '2309402394', fillAmount: '100' }

    params = { orderId: '2' }

    fillStub = {
      findOne: sinon.stub().resolves(fill),
      STATUSES: fillStatuses
    }
    executeOrder.__set__('Fill', fillStub)

    orderStub = {
      findOne: sinon.stub().resolves(order),
      STATUSES: orderStatuses
    }
    executeOrder.__set__('Order', orderStub)
  })

  it('finds the order with the associated order id', async () => {
    await executeOrder({ params, logger, messenger }, {})

    expect(orderStub.findOne).to.have.been.calledOnce()
    expect(orderStub.findOne).to.have.been.calledWith({orderId: '2'})
  })

  it('throws an error if the order does not exist', () => {
    orderStub.findOne.resolves()
    return expect(executeOrder({ params, logger, messenger }, {})).to.eventually.rejectedWith('No order with ID')
  })

  it('throws an error if the order is not in an filled status', () => {
    order.status = orderStatuses.CANCELLED
    const errorMessage = `Cannot fill order in ${order.status} status.`
    return expect(executeOrder({ params, send, messenger }, {})).to.eventually.rejectedWith(errorMessage)
  })

  it('finds the fill associated with the order', async () => {
    await executeOrder({ params, send, messenger }, {})

    expect(fillStub.findOne).to.have.been.calledOnce()
    expect(fillStub.findOne).to.have.been.calledWith({order_id: order._id, status: fillStatuses.ACCEPTED})
  })

  it('throws an error if the fill does not exist', () => {
    fillStub.findOne.resolves()
    return expect(executeOrder({ params, send, messenger }, {})).to.eventually.rejectedWith('No valid fill to trigger execution of.')
  })

  it('uses the messenger to set the payTo address', async () => {
    await executeOrder({ params, send, messenger }, {})

    expect(messenger.set).to.have.been.calledOnce()
    expect(messenger.set).to.have.been.calledWith(`execute:${order._id}`, order.payTo)
  })

  it('sends the response to the client', async () => {
    const res = await executeOrder({ params, send, messenger }, {})

    expect(res).to.eql({})
  })
})
