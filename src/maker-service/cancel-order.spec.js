const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const { expect } = chai

const cancelOrder = rewire(path.resolve(__dirname, 'cancel-order'))

describe('cancelOrder', () => {
  let params
  let logger
  let eventHandler
  let engine
  let orderStub
  let revertOrderStub
  let feeRefundInvoice
  let depositRefundInvoice
  let revertFeeRefundInvoiceStub
  let revertDepositRefundInvoiceStub
  let feeRefundInvoiceStub
  let depositRefundInvoiceStub
  let order
  let feeRefundPaymentRequest
  let depositRefundPaymentRequest
  let cancelStub

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }
    feeRefundPaymentRequest = 'asdf1234'
    depositRefundPaymentRequest = 'qwer1234'
    feeRefundInvoice = { paid: sinon.stub().returns(false), paymentRequest: feeRefundPaymentRequest, markAsPaid: sinon.stub() }
    depositRefundInvoice = { paid: sinon.stub().returns(false), paymentRequest: depositRefundPaymentRequest, markAsPaid: sinon.stub() }

    engine = {
      payInvoice: sinon.stub()
    }
    params = {
      orderId: '1'
    }
    cancelStub = sinon.stub()
    order = {_id: 'asfd', cancel: cancelStub, orderId: '1'}

    engine.payInvoice.withArgs(feeRefundPaymentRequest).resolves('feePreimage')
    engine.payInvoice.withArgs(depositRefundPaymentRequest).resolves('depositPreimage')

    feeRefundInvoiceStub = {findOne: sinon.stub().resolves(feeRefundInvoice)}
    depositRefundInvoiceStub = {findOne: sinon.stub().resolves(depositRefundInvoice)}
    orderStub = { findOne: sinon.stub().resolves(order) }
    eventHandler = {emit: sinon.stub()}
    revertOrderStub = cancelOrder.__set__('Order', orderStub)
    revertFeeRefundInvoiceStub = cancelOrder.__set__('FeeRefundInvoice', feeRefundInvoiceStub)
    revertDepositRefundInvoiceStub = cancelOrder.__set__('DepositRefundInvoice', depositRefundInvoiceStub)
  })

  afterEach(() => {
    revertOrderStub()
    revertFeeRefundInvoiceStub()
    revertDepositRefundInvoiceStub()
  })

  it('finds the order with the associated order id', async () => {
    await cancelOrder({ params, logger, eventHandler, engine }, { })

    expect(orderStub.findOne).to.have.been.calledWith({orderId: '1'})
  })

  it('throws an error if no order with the associated id can be found', () => {
    orderStub = { findOne: sinon.stub().resolves(null) }
    revertOrderStub = cancelOrder.__set__('Order', orderStub)
    const errorMessage = `Could not find order with orderId: 1`
    return expect(cancelOrder({ params, logger, eventHandler, engine }, { })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('cancels the order in the db', async () => {
    await cancelOrder({ params, logger, eventHandler, engine }, { })

    expect(cancelStub).to.have.been.called()
  })

  it('emits a cancelled order event', async () => {
    await cancelOrder({ params, logger, eventHandler, engine }, { })

    expect(eventHandler.emit).to.have.been.calledWith('order:cancelled', order)
  })

  it('finds the refund invoices in the db', async () => {
    await cancelOrder({ params, logger, eventHandler, engine }, { })

    expect(feeRefundInvoiceStub.findOne).to.have.been.calledWith({foreignId: order._id})
    expect(depositRefundInvoiceStub.findOne).to.have.been.calledWith({foreignId: order._id})
  })

  it('logs if the refund invoices cannot be found', async () => {
    feeRefundInvoiceStub = {findOne: sinon.stub().resolves(null)}
    depositRefundInvoiceStub = {findOne: sinon.stub().resolves(null)}
    revertFeeRefundInvoiceStub = cancelOrder.__set__('FeeRefundInvoice', feeRefundInvoiceStub)
    revertDepositRefundInvoiceStub = cancelOrder.__set__('DepositRefundInvoice', depositRefundInvoiceStub)

    await cancelOrder({ params, logger, eventHandler, engine }, { })

    expect(logger.info).to.have.been.calledWith('Invoices do not exist yet, could not refund', order.orderId)
  })

  it('checks if the invoices have been paid', async () => {
    await cancelOrder({ params, logger, eventHandler, engine }, { })

    expect(feeRefundInvoice.paid).to.have.been.called()
    expect(depositRefundInvoice.paid).to.have.been.called()
  })

  it('pays the invoices if they have not been paid', async () => {
    await cancelOrder({ params, logger, eventHandler, engine }, { })

    expect(engine.payInvoice).to.have.been.calledWith(feeRefundPaymentRequest)
    expect(engine.payInvoice).to.have.been.calledWith(depositRefundPaymentRequest)
    expect(feeRefundInvoice.markAsPaid).to.have.been.calledWith('feePreimage')
    expect(depositRefundInvoice.markAsPaid).to.have.been.calledWith('depositPreimage')
  })

  it('does not try to pay the invoices if they have not been paid', async () => {
    feeRefundInvoice = { paid: sinon.stub().returns(true), paymentRequest: feeRefundPaymentRequest, markAsPaid: sinon.stub() }
    depositRefundInvoice = { paid: sinon.stub().returns(true), paymentRequest: depositRefundPaymentRequest, markAsPaid: sinon.stub() }
    feeRefundInvoiceStub = {findOne: sinon.stub().resolves(feeRefundInvoice)}
    depositRefundInvoiceStub = {findOne: sinon.stub().resolves(depositRefundInvoice)}
    revertFeeRefundInvoiceStub = cancelOrder.__set__('FeeRefundInvoice', feeRefundInvoiceStub)
    revertDepositRefundInvoiceStub = cancelOrder.__set__('DepositRefundInvoice', depositRefundInvoiceStub)

    await cancelOrder({ params, logger, eventHandler, engine }, { })

    expect(feeRefundInvoice.paid).to.have.been.called()
    expect(depositRefundInvoice.paid).to.have.been.called()
    expect(engine.payInvoice).to.have.not.been.called()
    expect(feeRefundInvoice.markAsPaid).to.have.not.been.called()
    expect(depositRefundInvoice.markAsPaid).to.have.not.been.called()
  })
})
