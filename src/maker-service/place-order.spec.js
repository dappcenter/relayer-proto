const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const { Big } = require('../utils')

const { expect } = chai

const placeOrder = rewire(path.resolve(__dirname, 'place-order'))

describe('placeOrder', () => {
  let params
  let logger
  let eventHandler
  let engine
  let EmptyResponse
  let orderStub
  let revertOrderStub
  let feeInvoiceStub
  let depositInvoiceStub
  let revertFeeInvoiceStub
  let revertDepositInvoiceStub
  let feeInvoice
  let depositInvoice
  let depositInvoicePaymentRequest
  let feeInvoicePaymentRequest
  let feeRefundInvoice
  let depositRefundInvoice
  let feeRefundPaymentRequest
  let depositRefundPaymentRequest
  let revertFeeRefundInvoiceStub
  let revertDepositRefundInvoiceStub
  let feeRefundInvoiceStub
  let depositRefundInvoiceStub
  let placeStub
  let order

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }
    feeInvoice = {settled: true, value: 100}
    depositInvoice = {settled: true, value: 100}
    feeRefundInvoice = {value: 100}
    depositRefundInvoice = {value: 100}
    feeInvoicePaymentRequest = 'asdfasdf'
    depositInvoicePaymentRequest = 'zxcvasdf'
    feeRefundPaymentRequest = 'asdf1234'
    depositRefundPaymentRequest = 'qwer1234'

    engine = {
      isInvoicePaid: sinon.stub(),
      getInvoiceValue: sinon.stub(),
      isBalanceSufficient: sinon.stub(),
      payInvoice: sinon.stub()
    }
    params = {
      orderId: '1',
      feeRefundPaymentRequest,
      depositRefundPaymentRequest
    }
    placeStub = sinon.stub()
    order = {orderId: '2', _id: 'asfd', place: placeStub, payTo: 'ln:asdf1234', counterAmount: Big(1000), baseAmount: Big(100)}

    engine.isInvoicePaid.withArgs(feeInvoicePaymentRequest).resolves(feeInvoice.settled)
    engine.isInvoicePaid.withArgs(depositInvoicePaymentRequest).resolves(depositInvoice.settled)
    engine.getInvoiceValue.withArgs(feeRefundPaymentRequest).resolves(feeRefundInvoice.value)
    engine.getInvoiceValue.withArgs(depositRefundPaymentRequest).resolves(depositRefundInvoice.value)
    engine.getInvoiceValue.withArgs(feeInvoicePaymentRequest).resolves(feeInvoice.value)
    engine.getInvoiceValue.withArgs(depositInvoicePaymentRequest).resolves(depositInvoice.value)
    engine.isBalanceSufficient.withArgs('asdf1234', Big(1000), {outbound: true}).resolves(true)
    engine.isBalanceSufficient.withArgs('asdf1234', Big(100), {outbound: false}).resolves(true)
    engine.payInvoice.resolves(null)

    feeInvoiceStub = { findOne: sinon.stub().resolves({paymentRequest: feeInvoicePaymentRequest}) }
    depositInvoiceStub = { findOne: sinon.stub().resolves({paymentRequest: depositInvoicePaymentRequest}) }
    feeRefundInvoiceStub = {create: sinon.stub()}
    depositRefundInvoiceStub = {create: sinon.stub()}
    orderStub = { findOne: sinon.stub().resolves(order), STATUSES: { CANCELLED: 'CANCELLED' } }
    eventHandler = {emit: sinon.stub()}
    EmptyResponse = sinon.stub()
    revertOrderStub = placeOrder.__set__('Order', orderStub)
    revertFeeInvoiceStub = placeOrder.__set__('FeeInvoice', feeInvoiceStub)
    revertDepositInvoiceStub = placeOrder.__set__('DepositInvoice', depositInvoiceStub)
    revertFeeRefundInvoiceStub = placeOrder.__set__('FeeRefundInvoice', feeRefundInvoiceStub)
    revertDepositRefundInvoiceStub = placeOrder.__set__('DepositRefundInvoice', depositRefundInvoiceStub)
  })

  afterEach(() => {
    revertFeeInvoiceStub()
    revertOrderStub()
    revertDepositInvoiceStub()
    revertFeeRefundInvoiceStub()
    revertDepositRefundInvoiceStub()
  })

  it('finds the order with the associated order id', () => {
    placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(orderStub.findOne).to.have.been.calledWith({orderId: '1'})
  })

  it('finds the fee invoice with the associated order id', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(feeInvoiceStub.findOne).to.have.been.calledWith({ foreignId: 'asfd' })
  })

  it('finds the deposit invoice with the associated order id', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(depositInvoiceStub.findOne).to.have.been.calledWith({ foreignId: 'asfd' })
  })

  it('raises an error if there is no fee invoice associated with the order id', async () => {
    feeInvoiceStub.findOne.resolves(null)
    const errorMessage = `Could not place order. Please create another order and try again. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('raises an error if there is no deposit invoice associated with the order id', () => {
    depositInvoiceStub.findOne.resolves(null)
    const errorMessage = `Could not place order. Please create another order and try again. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('fetches the fee invoice from the engine', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(engine.isInvoicePaid).to.have.been.calledWith('asdfasdf')
  })

  it('fetches the deposit invoice from the engine', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(engine.isInvoicePaid).to.have.been.calledWith('zxcvasdf')
  })

  it('throws an error if the fee invoice has not been paid', async () => {
    engine.isInvoicePaid.withArgs(feeInvoicePaymentRequest).resolves(false)

    const errorMessage = `Fee Invoice has not been paid. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if the fee invoice has not been paid', async () => {
    engine.isInvoicePaid.withArgs(depositInvoicePaymentRequest).resolves(false)

    const errorMessage = `Deposit Invoice has not been paid. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('fetches the fee refund payment request details from the engine', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(engine.getInvoiceValue).to.have.been.calledWith(params.feeRefundPaymentRequest)
  })

  it('fetches the deposit refund payment request details from the engine', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(engine.getInvoiceValue).to.have.been.calledWith(params.depositRefundPaymentRequest)
  })

  it('throws an error if the fee invoice value is not equal to the fee refund invoice value', async () => {
    const feeRefundInvoice = {value: 1000}
    engine.getInvoiceValue.withArgs(feeRefundPaymentRequest).resolves(feeRefundInvoice)

    const errorMessage = `Fee Invoice Refund value is not the same as Fee Invoice value. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if the deposit invoice value is not equal to the deposit refund invoice value', async () => {
    const depositRefundInvoice = {value: 1000}
    engine.getInvoiceValue.withArgs(depositRefundPaymentRequest).resolves(depositRefundInvoice)

    const errorMessage = `Deposit Invoice Refund value is not the same as Deposit Invoice value. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('creates a fee refund invoice', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(feeRefundInvoiceStub.create).to.have.been.calledWith({foreignId: 'asfd', paymentRequest: feeRefundPaymentRequest})
  })

  it('creates a deposit refund invoice', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(depositRefundInvoiceStub.create).to.have.been.calledWith({foreignId: 'asfd', paymentRequest: depositRefundPaymentRequest})
  })

  it('pays the refund invoices and returns if the order is in a cancelled state', async () => {
    order = {orderId: '2', _id: 'asfd', place: placeStub, payTo: 'ln:asdf1234', counterAmount: Big(1000), baseAmount: Big(100), status: 'CANCELLED'}
    orderStub = { findOne: sinon.stub().resolves(order), STATUSES: { CANCELLED: 'CANCELLED' } }
    revertOrderStub = placeOrder.__set__('Order', orderStub)
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(engine.payInvoice).to.have.been.calledWith(feeRefundPaymentRequest)
    expect(engine.payInvoice).to.have.been.calledWith(depositRefundPaymentRequest)
    expect(placeStub).to.have.not.been.called()
  })

  it('places the order', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(placeStub).to.have.been.called()
  })

  it('emits an order:placed event', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(eventHandler.emit).to.have.been.calledWith('order:placed', order)
  })

  it('returns an OrderPlacedResponse', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(EmptyResponse).to.have.been.calledWith({})
  })

  it('checks if there is an outbound channel with sufficient funds to place the order', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(engine.isBalanceSufficient).to.have.been.calledWith('asdf1234', Big(1000), {outbound: true})
  })

  it('checks if there is an inbound channel with sufficient funds to place the order', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })

    expect(engine.isBalanceSufficient).to.have.been.calledWith('asdf1234', Big(100), {outbound: false})
  })

  it('throws an error if there is not an outbound channel with sufficient funds to place the order', async () => {
    engine.isBalanceSufficient.withArgs('asdf1234', Big(1000), {outbound: true}).resolves(false)

    const errorMessage = `Outbound channel does not have sufficient balance. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if there is not an inbound channel with sufficient funds to place the order', async () => {
    engine.isBalanceSufficient.withArgs('asdf1234', Big(100), {outbound: false}).resolves(false)

    const errorMessage = `Inbound channel does not have sufficient balance. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { EmptyResponse })).to.eventually.be.rejectedWith(errorMessage)
  })
})
