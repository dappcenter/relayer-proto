const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const { Big } = require('../utils')

const { expect } = chai

const createFill = rewire(path.resolve(__dirname, 'create-fill'))

describe('createFill', () => {
  let params
  let logger
  let eventHandler
  let engine
  let CreateFillResponse
  let fillStub
  let orderStub
  let generateInvoicesStub
  let revertOrderStub
  let revertGenerateInvoicesStub
  let FailedToCreateFillError
  let revertFillStub
  let fill
  let FeeInvoiceStub
  let revertFeeInvoiceStub

  beforeEach(() => {
    logger = {
      info: sinon.stub()
    }
    engine = sinon.stub()
    params = {
      orderId: '2',
      swapHash: 'asdf1234',
      fillAmount: 1000,
      takerPayTo: 'ln:asdfasdf'
    }
    fill = {
      fillAmount: 1000,
      fillId: '1',
      _id: 'asdf'
    }
    FeeInvoiceStub = {
      FOREIGN_TYPES: {
        ORDER: 'ORDER',
        FILL: 'FILL'
      }
    }
    orderStub = { findOne: sinon.stub().resolves({orderId: '2', _id: 'asdf', status: 'PLACED', baseAmount: Big(1000)}), STATUSES: { PLACED: 'PLACED' } }
    fillStub = { create: sinon.stub().resolves(fill) }
    eventHandler = {emit: sinon.stub()}
    generateInvoicesStub = sinon.stub().resolves([{_id: '1', paymentRequest: '1234'}, {_id: '2', paymentRequest: '4321'}])
    CreateFillResponse = sinon.stub()
    revertFillStub = createFill.__set__('Fill', fillStub)
    revertOrderStub = createFill.__set__('Order', orderStub)
    revertGenerateInvoicesStub = createFill.__set__('generateInvoices', generateInvoicesStub)
    FailedToCreateFillError = createFill.__get__('FailedToCreateFillError')
    revertFeeInvoiceStub = createFill.__set__('Invoice', FeeInvoiceStub)
  })

  afterEach(() => {
    revertFillStub()
    revertOrderStub()
    revertGenerateInvoicesStub()
    revertFeeInvoiceStub()
  })

  it('finds the order with the associated order id', () => {
    createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })

    expect(orderStub.findOne).to.have.been.calledWith({orderId: '2'})
  })

  it('throws an error if no order with the associated order id can be found', () => {
    orderStub.findOne.resolves(null)
    const errorMessage = `No order exists with Order ID 2.`
    createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })

    return expect(createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if the order status is not PLACED', () => {
    orderStub.findOne.resolves({orderId: '2', _id: 'asdf', status: 'NOT PLACED'})
    const errorMessage = 'Order ID 2 is not in a state to be filled'
    createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })

    return expect(createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if the fill amount is larger than order baseAmount', () => {
    orderStub.findOne.resolves({orderId: '2', _id: 'asdf', status: 'PLACED', baseAmount: Big(100)})
    const errorMessage = 'Fill amount is larger than order baseAmount for Order ID 2'
    createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })

    return expect(createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('creates an fill from the params', async () => {
    await createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })

    expect(fillStub.create).to.have.been.calledWith({
      order_id: 'asdf',
      swapHash: Buffer.from(params.swapHash, 'base64'),
      fillAmount: Big(params.fillAmount),
      takerPayTo: 'ln:asdfasdf'
    })
  })

  it('throws an error if creating a fill fails', () => {
    fillStub.create.rejects('error')

    return expect(createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })).to.eventually.be.rejectedWith(FailedToCreateFillError)
  })

  it('generateInvoices', async () => {
    await createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })

    expect(generateInvoicesStub).to.have.been.calledWith(1000, '1', 'asdf', engine, 'FILL', logger)
  })

  it('throws an error if generating an order fails', () => {
    fillStub.create.rejects('error')

    return expect(createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })).to.eventually.be.rejectedWith(FailedToCreateFillError)
  })

  it('emits an event fill:created event', async () => {
    await createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })

    expect(eventHandler.emit).to.have.been.calledWith('fill:created', fill)
  })

  it('returns a CreateFillResponse', async () => {
    await createFill({ params, logger, eventHandler, engine }, { CreateFillResponse })

    expect(CreateFillResponse).to.have.been.calledWith({fillId: '1', depositPaymentRequest: '1234', feePaymentRequest: '4321'})
  })
})
