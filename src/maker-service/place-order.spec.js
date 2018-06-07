const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
// const bigInt = require('big-integer')

const { expect } = chai

const placeOrder = rewire(path.resolve(__dirname, 'place-order'))

describe('placeOrder', () => {
  let params
  let logger
  let eventHandler
  let engine
  let PlaceOrderResponse
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

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }
    feeInvoice = {settled: true, value: 100}
    depositInvoice = {settled: true, value: 100}
    feeRefundInvoice = {numSatoshis: 100}
    depositRefundInvoice = {numSatoshis: 100}
    feeInvoicePaymentRequest = 'asdfasdf'
    depositInvoicePaymentRequest = 'zxcvasdf'
    feeRefundPaymentRequest = 'asdf1234'
    depositRefundPaymentRequest = 'qwer1234'

    engine = {
      getInvoice: sinon.stub(),
      getPaymentRequestDetails: sinon.stub()
    }
    params = {
      orderId: '1',
      feeRefundPaymentRequest,
      depositRefundPaymentRequest
    }
    engine.getInvoice.withArgs(feeInvoicePaymentRequest).resolves(feeInvoice)
    engine.getInvoice.withArgs(depositInvoicePaymentRequest).resolves(depositInvoice)
    engine.getPaymentRequestDetails.withArgs(feeRefundPaymentRequest).resolves(feeRefundInvoice)
    engine.getPaymentRequestDetails.withArgs(depositRefundPaymentRequest).resolves(depositRefundInvoice)

    feeInvoiceStub = { findOne: sinon.stub().resolves({paymentRequest: feeInvoicePaymentRequest}) }
    depositInvoiceStub = { findOne: sinon.stub().resolves({paymentRequest: depositInvoicePaymentRequest}) }
    feeRefundInvoiceStub = {create: sinon.stub()}
    depositRefundInvoiceStub = {create: sinon.stub()}
    placeStub = sinon.stub()
    orderStub = { findOne: sinon.stub().resolves({orderId: '2', _id: 'asfd', place: placeStub}) }
    eventHandler = {emit: sinon.stub()}
    PlaceOrderResponse = sinon.stub()
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
    placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(orderStub.findOne).to.have.been.calledWith({orderId: '1'})
  })

  it('finds the fee invoice with the associated order id', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(feeInvoiceStub.findOne).to.have.been.calledWith({ foreignId: 'asfd' })
  })

  it('finds the deposit invoice with the associated order id', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(depositInvoiceStub.findOne).to.have.been.calledWith({ foreignId: 'asfd' })
  })

  it('raises an error if there is no fee invoice associated with the order id', async () => {
    feeInvoiceStub.findOne.resolves(null)
    const errorMessage = `Could not place order. Please create another order and try again. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('raises an error if there is no deposit invoice associated with the order id', () => {
    depositInvoiceStub.findOne.resolves(null)
    const errorMessage = `Could not place order. Please create another order and try again. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('fetches the fee invoice from the engine', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(engine.getInvoice).to.have.been.calledWith('asdfasdf')
  })

  it('fetches the deposit invoice from the engine', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(engine.getInvoice).to.have.been.calledWith('zxcvasdf')
  })

  it('throws an error if the fee invoice has not been paid', async () => {
    feeInvoice = {settled: false, value: 100}
    engine.getInvoice.withArgs(feeInvoicePaymentRequest).resolves(feeInvoice)

    const errorMessage = `Fee Invoice has not been paid. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if the fee invoice has not been paid', async () => {
    depositInvoice = {settled: false, value: 100}
    engine.getInvoice.withArgs(depositInvoicePaymentRequest).resolves(depositInvoice)

    const errorMessage = `Deposit Invoice has not been paid. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('fetches the fee refund payment request details from the engine', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(engine.getPaymentRequestDetails).to.have.been.calledWith(params.feeRefundPaymentRequest)
  })

  it('fetches the deposit refund payment request details from the engine', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(engine.getPaymentRequestDetails).to.have.been.calledWith(params.depositRefundPaymentRequest)
  })

  it('throws an error if the fee invoice value is not equal to the fee refund invoice value', async () => {
    const feeRefundInvoice = {numSatoshis: 1000}
    engine.getPaymentRequestDetails.withArgs(feeRefundPaymentRequest).resolves(feeRefundInvoice)

    const errorMessage = `Fee Invoice Refund value is not the same as Fee Invoice value. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if the deposit invoice value is not equal to the deposit refund invoice value', async () => {
    const depositRefundInvoice = {numSatoshis: 1000}
    engine.getPaymentRequestDetails.withArgs(depositRefundPaymentRequest).resolves(depositRefundInvoice)

    const errorMessage = `Deposit Invoice Refund value is not the same as Deposit Invoice value. Order id: 2`

    return expect(placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('creates a fee refund invoice', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(feeRefundInvoiceStub.create).to.have.been.calledWith({foreignId: 'asfd', paymentRequest: feeRefundPaymentRequest})
  })

  it('creates a deposit refund invoice', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(depositRefundInvoiceStub.create).to.have.been.calledWith({foreignId: 'asfd', paymentRequest: depositRefundPaymentRequest})
  })

  it('places the order', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(placeStub).to.have.been.called()
  })

  it('emits an order:placed event', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(eventHandler.emit).to.have.been.calledWith('order:placed', {orderId: '2', _id: 'asfd', place: placeStub})
  })

  it('returns an OrderPlacedResponse', async () => {
    await placeOrder({ params, logger, eventHandler, engine }, { PlaceOrderResponse })

    expect(PlaceOrderResponse).to.have.been.calledWith({})
  })
})
