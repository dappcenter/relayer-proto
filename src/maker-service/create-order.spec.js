const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const bigInt = require('big-integer')

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
    marketStub = { getByObject: sinon.stub().returns({name: 'BTC/LTC'}) }
    orderStub = { create: sinon.stub().returns({orderId: '2'}) }

    eventHandler = {emit: sinon.stub()}
    generateInvoicesStub = sinon.stub().returns([{_id: '1', paymentRequest: '1234'}, {_id: '2', paymentRequest: '4321'}])
    CreateOrderResponse = sinon.stub()
    revertMarketStub = createOrder.__set__('Market', marketStub)
    revertOrderStub = createOrder.__set__('Order', orderStub)
    revertGenerateInvoicesStub = createOrder.__set__('generateInvoices', generateInvoicesStub)
  })

  afterEach(() => {
    revertMarketStub()
    revertOrderStub()
    revertGenerateInvoicesStub()
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
      baseAmount: bigInt(100),
      counterAmount: bigInt(1000),
      side: 'BID'
    })
  })

  it('generateInvoices', async () => {
    await createOrder({ params, logger, eventHandler, engine }, { CreateOrderResponse })

    expect(generateInvoicesStub).to.have.been.calledWith({orderId: '2'}, engine)
  })

  it('emits an event order:created event', async () => {
    await createOrder({ params, logger, eventHandler, engine }, { CreateOrderResponse })

    expect(eventHandler.emit).to.have.been.calledWith('order:created', {orderId: '2'})
  })

  it('returns a CreateOrderResponse', async () => {
    await createOrder({ params, logger, eventHandler, engine }, { CreateOrderResponse })

    expect(CreateOrderResponse).to.have.been.calledWith({orderId: '2', depositRequest: '1234', feeRequest: '4321'})
  })
})

describe('generateInvoices', () => {
  let order
  let engine
  let feeInvoiceStub
  let depositInvoiceStub
  let revertDepositInvoicestub
  let revertFeeInvoiceStub
  let generateInvoices

  beforeEach(() => {
    order = {
      baseAmount: bigInt(100),
      orderId: '1234',
      _id: '1'
    }
    engine = {createInvoice: sinon.stub().returns('1234')}

    feeInvoiceStub = { create: sinon.stub().returns({}) }
    depositInvoiceStub = { create: sinon.stub().returns({}) }

    generateInvoices = createOrder.__get__('generateInvoices')

    revertDepositInvoicestub = createOrder.__set__('DepositInvoice', feeInvoiceStub)
    revertFeeInvoiceStub = createOrder.__set__('FeeInvoice', depositInvoiceStub)
  })

  afterEach(() => {
    revertDepositInvoicestub()
    revertFeeInvoiceStub()
  })

  it('creates deposit and fee invoices in the engine', () => {
    generateInvoices(order, engine)

    expect(engine.createInvoice).to.have.been.calledTwice()
    expect(engine.createInvoice).to.have.been.calledWith('1234', 120, 10)
    expect(engine.createInvoice).to.have.been.calledWith('1234', 120, 10)
  })

  it('creates fee and deposit invoices in the database', async () => {
    await generateInvoices(order, engine)

    expect(feeInvoiceStub.create).to.have.been.calledWith({ foreignId: '1', paymentRequest: '1234' })
    expect(depositInvoiceStub.create).to.have.been.calledWith({ foreignId: '1', paymentRequest: '1234' })
  })

  it('returns the deposit and fee invoice recors', async () => {
    const res = await generateInvoices(order, engine)

    expect(res).to.eql([{}, {}])
  })
})
