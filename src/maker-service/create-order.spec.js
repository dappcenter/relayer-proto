const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const { Big } = require('../utils')

const { expect } = chai

const createOrder = rewire(path.resolve(__dirname, 'create-order'))

describe('createOrder', () => {
  let params
  let logger
  let eventHandler
  let engine
  let CreateOrderResponse
  let marketStub
  let orderStub
  let generateInvoicesStub
  let revertOrderStub
  let revertMarketStub
  let revertGenerateInvoicesStub
  let FeeInvoiceStub
  let order
  let revertInvoiceStub
  let FailedToCreateOrderError

  beforeEach(() => {
    logger = {
      info: sinon.stub()
    }
    engine = sinon.stub()
    params = {
      payTo: 'payTo',
      ownerId: '1',
      baseAmount: 100,
      baseSymbol: 'BTC',
      counterAmount: 1000,
      counterSymbol: 'LTC',
      side: 'BID'
    }
    order = Object.assign({orderId: '2', _id: '1'}, params)
    marketStub = { getByObject: sinon.stub().returns({name: 'BTC/LTC'}) }
    orderStub = { create: sinon.stub().returns(order) }

    FeeInvoiceStub = {
      FOREIGN_TYPES: {
        ORDER: 'ORDER',
        FILL: 'FILL'
      }
    }

    eventHandler = {emit: sinon.stub()}
    generateInvoicesStub = sinon.stub().returns([{_id: '1', paymentRequest: '1234'}, {_id: '2', paymentRequest: '4321'}])
    CreateOrderResponse = sinon.stub()
    revertMarketStub = createOrder.__set__('Market', marketStub)
    revertOrderStub = createOrder.__set__('Order', orderStub)
    revertGenerateInvoicesStub = createOrder.__set__('generateInvoices', generateInvoicesStub)
    revertInvoiceStub = createOrder.__set__('FeeInvoice', FeeInvoiceStub)
    FailedToCreateOrderError = createOrder.__get__('FailedToCreateOrderError')
  })

  afterEach(() => {
    revertMarketStub()
    revertOrderStub()
    revertGenerateInvoicesStub()
    revertInvoiceStub()
  })

  it('finds the correct market', () => {
    createOrder({ params, logger, eventHandler, engine }, { CreateOrderResponse })

    expect(marketStub.getByObject).to.have.been.calledWith({baseSymbol: 'BTC', counterSymbol: 'LTC'})
  })

  it('creates an order from the params', async () => {
    await createOrder({ params, logger, eventHandler, engine }, { CreateOrderResponse })

    expect(orderStub.create).to.have.been.calledWith({
      payTo: 'payTo',
      ownerId: '1',
      marketName: 'BTC/LTC',
      baseAmount: Big(100),
      counterAmount: Big(1000),
      side: 'BID'
    })
  })

  it('throws an error if creating an order fails', () => {
    orderStub.create.rejects('error')

    return expect(createOrder({ params, logger, eventHandler, engine }, { CreateOrderResponse })).to.eventually.be.rejectedWith(FailedToCreateOrderError)
  })

  it('generateInvoices', async () => {
    await createOrder({ params, logger, eventHandler, engine }, { CreateOrderResponse })

    expect(generateInvoicesStub).to.have.been.calledWith(100, '2', '1', engine, 'ORDER', logger)
  })

  it('throws an error if generating an order fails', () => {
    orderStub.create.rejects('error')

    return expect(createOrder({ params, logger, eventHandler, engine }, { CreateOrderResponse })).to.eventually.be.rejectedWith(FailedToCreateOrderError)
  })

  it('emits an event order:created event', async () => {
    await createOrder({ params, logger, eventHandler, engine }, { CreateOrderResponse })

    expect(eventHandler.emit).to.have.been.calledWith('order:created', order)
  })

  it('returns a CreateOrderResponse', async () => {
    await createOrder({ params, logger, eventHandler, engine }, { CreateOrderResponse })

    expect(CreateOrderResponse).to.have.been.calledWith({orderId: '2', depositPaymentRequest: '1234', feePaymentRequest: '4321'})
  })
})
