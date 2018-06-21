const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const { Big } = require('../utils')

const { expect } = chai

const fillOrder = rewire(path.resolve(__dirname, 'fill-order'))

describe('fillOrder', () => {
  let params
  let logger
  let messenger
  let engine
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
  let acceptStub
  let fillStub
  let order
  let fill
  let orderFillStub
  let invoiceStub
  let revertInvoiceStub
  let revertFillStub

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }
    messenger = { set: sinon.stub().resolves() }
    feeInvoice = {settled: true, value: 100}
    depositInvoice = {settled: true, value: 100}
    feeRefundInvoice = {value: 100, markAsPaid: sinon.stub().withArgs('feePreimage').resolves()}
    depositRefundInvoice = {value: 100, markAsPaid: sinon.stub().withArgs('depositPreimage').resolves()}
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
      fillId: '1',
      feeRefundPaymentRequest,
      depositRefundPaymentRequest
    }
    orderFillStub = sinon.stub()
    acceptStub = sinon.stub()

    fill = {fillId: '1', _id: 'asfd', accept: acceptStub, payTo: 'ln:asdf1234', counterAmount: Big(1000), baseAmount: Big(100), order_id: '2', takerPayTo: 'ln:fdsa4321'}
    order = {orderId: '2', _id: 'asfd', fill: orderFillStub, payTo: 'ln:asdf1234', counterAmount: Big(1000), baseAmount: Big(100), status: 'PLACED'}

    engine.isInvoicePaid.withArgs(feeInvoicePaymentRequest).resolves(feeInvoice.settled)
    engine.isInvoicePaid.withArgs(depositInvoicePaymentRequest).resolves(depositInvoice.settled)
    engine.getInvoiceValue.withArgs(feeRefundPaymentRequest).resolves(feeRefundInvoice.value)
    engine.getInvoiceValue.withArgs(depositRefundPaymentRequest).resolves(depositRefundInvoice.value)
    engine.getInvoiceValue.withArgs(feeInvoicePaymentRequest).resolves(feeInvoice.value)
    engine.getInvoiceValue.withArgs(depositInvoicePaymentRequest).resolves(depositInvoice.value)
    engine.isBalanceSufficient.withArgs('asdf1234', Big(1000), {outbound: true}).resolves(true)
    engine.isBalanceSufficient.withArgs('asdf1234', Big(100), {outbound: false}).resolves(true)
    engine.isBalanceSufficient.withArgs('fdsa4321', Big(1000), {outbound: true}).resolves(true)
    engine.isBalanceSufficient.withArgs('fdsa4321', Big(100), {outbound: false}).resolves(true)
    engine.payInvoice.withArgs(feeRefundPaymentRequest).resolves('feePreimage')
    engine.payInvoice.withArgs(depositRefundPaymentRequest).resolves('depositPreimage')

    invoiceStub = {
      FOREIGN_TYPES: { FILL: 'FILL' },
      TYPES: { INCOMING: 'INCOMING', OUTGOING: 'OUTGOING' },
      PURPOSES: { FEE: 'FEE', DEPOSIT: 'DEPOSIT' }
    }

    feeInvoiceStub = { findOne: sinon.stub().resolves({paymentRequest: feeInvoicePaymentRequest}) }
    depositInvoiceStub = {findOne: sinon.stub().resolves({paymentRequest: depositInvoicePaymentRequest})}
    feeRefundInvoiceStub = {create: sinon.stub().resolves(feeRefundInvoice)}
    depositRefundInvoiceStub = {create: sinon.stub().resolves(depositRefundInvoice)}
    orderStub = { findOne: sinon.stub().resolves(order), STATUSES: { PLACED: 'PLACED' } }
    fillStub = { findOne: sinon.stub().resolves(fill) }
    revertFillStub = fillOrder.__set__('Fill', fillStub)
    revertOrderStub = fillOrder.__set__('Order', orderStub)
    revertFeeInvoiceStub = fillOrder.__set__('FeeInvoice', feeInvoiceStub)
    revertDepositInvoiceStub = fillOrder.__set__('DepositInvoice', depositInvoiceStub)
    revertFeeRefundInvoiceStub = fillOrder.__set__('FeeRefundInvoice', feeRefundInvoiceStub)
    revertDepositRefundInvoiceStub = fillOrder.__set__('DepositRefundInvoice', depositRefundInvoiceStub)
    revertInvoiceStub = fillOrder.__set__('Invoice', invoiceStub)
  })

  afterEach(() => {
    revertFeeInvoiceStub()
    revertOrderStub()
    revertDepositInvoiceStub()
    revertFeeRefundInvoiceStub()
    revertDepositRefundInvoiceStub()
    revertInvoiceStub()
    revertFillStub()
  })

  it('finds the fill with the associated fill id', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(fillStub.findOne).to.have.been.calledWith({fillId: '1'})
  })

  it('throws an error if the fill does not exist', () => {
    fillStub.findOne.resolves()
    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.rejectedWith(`No fill with ID ${fill.fillId}.`)
  })

  it('finds the order with the associated fill', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(orderStub.findOne).to.have.been.calledWith({ _id: fill.order_id })
  })

  it('throws an error if the fill does not exist', () => {
    orderStub.findOne.resolves()
    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.rejectedWith(`No order associated with fill ${fill.fillId}.`)
  })

  it('finds the fee invoice with the associated order id', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(feeInvoiceStub.findOne).to.have.been.calledWith({
      foreignId: 'asfd',
      foreignType: 'FILL',
      purpose: 'FEE',
      type: 'INCOMING'
    })
  })

  it('finds the deposit invoice with the associated order id', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(depositInvoiceStub.findOne).to.have.been.calledWith({
      foreignId: 'asfd',
      foreignType: 'FILL',
      purpose: 'DEPOSIT',
      type: 'INCOMING'
    })
  })

  it('raises an error if there is no fee invoice associated with the order id', async () => {
    feeInvoiceStub.findOne.resolves(null)
    const errorMessage = `Could not find fee invoice associated with Fill asfd.`

    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('raises an error if there is no deposit invoice associated with the order id', () => {
    depositInvoiceStub.findOne.resolves(null)
    const errorMessage = `Could not find deposit invoice associated with Fill asfd.`

    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('checks if the fee invoice has been paid', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(engine.isInvoicePaid).to.have.been.calledWith('asdfasdf')
  })

  it('checks if the deposit invoice has been paid', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(engine.isInvoicePaid).to.have.been.calledWith('zxcvasdf')
  })

  it('throws an error if the fee invoice has not been paid', async () => {
    engine.isInvoicePaid.withArgs(feeInvoicePaymentRequest).resolves(false)

    const errorMessage = 'Fee Invoice for Order 2 has not been paid.'

    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if the fee invoice has not been paid', async () => {
    engine.isInvoicePaid.withArgs(depositInvoicePaymentRequest).resolves(false)

    const errorMessage = 'Deposit Invoice for Order 2 has not been paid.'

    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('creates a fee refund invoice', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(feeRefundInvoiceStub.create).to.have.been.calledWith({
      foreignId: 'asfd',
      foreignType: 'FILL',
      paymentRequest: 'asdf1234',
      purpose: 'FEE',
      type: 'OUTGOING'
    })
  })

  it('creates a deposit refund invoice', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(depositRefundInvoiceStub.create).to.have.been.calledWith({
      foreignId: 'asfd',
      foreignType: 'FILL',
      paymentRequest: 'qwer1234',
      purpose: 'DEPOSIT',
      type: 'OUTGOING'
    })
  })

  it('fetches the fee refund payment request details from the engine', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(engine.getInvoiceValue).to.have.been.calledWith(params.feeRefundPaymentRequest)
  })

  it('fetches the deposit refund payment request details from the engine', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(engine.getInvoiceValue).to.have.been.calledWith(params.depositRefundPaymentRequest)
  })

  it('throws an error if the fee invoice value is not equal to the fee refund invoice value', async () => {
    const feeRefundInvoice = {value: 1000}
    engine.getInvoiceValue.withArgs(feeRefundPaymentRequest).resolves(feeRefundInvoice)

    const errorMessage = `Fee Invoice Refund value is not the same as Fee Invoice value. Order id: 2`

    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if the deposit invoice value is not equal to the deposit refund invoice value', async () => {
    const depositRefundInvoice = {value: 1000}
    engine.getInvoiceValue.withArgs(depositRefundPaymentRequest).resolves(depositRefundInvoice)

    const errorMessage = `Deposit Invoice Refund value is not the same as Deposit Invoice value. Order id: 2`

    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('checks if there is an outbound channel with sufficient funds on the maker to place the order', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(engine.isBalanceSufficient).to.have.been.calledWith('asdf1234', Big(1000), {outbound: true})
  })

  it('checks if there is an inbound channel with sufficient funds on the maker to place the order', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(engine.isBalanceSufficient).to.have.been.calledWith('asdf1234', Big(100), {outbound: false})
  })

  it('checks if there is an outbound channel with sufficient funds on the taker to place the order', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(engine.isBalanceSufficient).to.have.been.calledWith('fdsa4321', Big(1000), {outbound: true})
  })

  it('checks if there is an inbound channel with sufficient funds on the taker to place the order', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(engine.isBalanceSufficient).to.have.been.calledWith('fdsa4321', Big(100), {outbound: false})
  })

  it('throws an error if there is not an outbound channel with sufficient funds on the maker to place the order', async () => {
    engine.isBalanceSufficient.withArgs('asdf1234', Big(1000), {outbound: true}).resolves(false)

    const errorMessage = `Outbound channel does not have sufficient balance. Order id: 2`

    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if there is not an inbound channel with sufficient funds on the maker to place the order', async () => {
    engine.isBalanceSufficient.withArgs('asdf1234', Big(100), {outbound: false}).resolves(false)

    const errorMessage = `Inbound channel does not have sufficient balance. Order id: 2`

    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if there is not an outbound channel with sufficient funds on the taker to place the order', async () => {
    engine.isBalanceSufficient.withArgs('fdsa4321', Big(1000), {outbound: true}).resolves(false)

    const errorMessage = `Outbound channel does not have sufficient balance. Order id: 2`

    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('throws an error if there is not an inbound channel with sufficient funds on the taker to place the order', async () => {
    engine.isBalanceSufficient.withArgs('fdsa4321', Big(100), {outbound: false}).resolves(false)

    const errorMessage = `Inbound channel does not have sufficient balance. Order id: 2`

    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('refunds the invoices if the order is not in a placed state', async () => {
    order.status = 'CANCELLED'

    try {
      await fillOrder({ params, logger, messenger, engine })
    } catch (err) {
      expect(engine.payInvoice).to.have.been.calledWith(feeRefundPaymentRequest)
      expect(engine.payInvoice).to.have.been.calledWith(depositRefundPaymentRequest)
      expect(feeRefundInvoice.markAsPaid).to.have.been.calledWith('feePreimage')
      expect(depositRefundInvoice.markAsPaid).to.have.been.calledWith('depositPreimage')
    }
  })

  it('throws an error if the order is not in a placed state', async () => {
    order.status = 'CANCELLED'
    const errorMessage = 'Order is not in a placed status, refunds have been executed. Order id: 2'
    return expect(fillOrder({ params, logger, messenger, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('accepts the fill', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(acceptStub).to.have.been.called()
  })

  it('fills the order', async () => {
    await fillOrder({ params, logger, messenger, engine })

    expect(orderFillStub).to.have.been.called()
  })

  it('returns an empty object', async () => {
    const res = await fillOrder({ params, logger, messenger, engine })

    expect(res).to.eql({})
  })
})
