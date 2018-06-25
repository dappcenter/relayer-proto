const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const { Big } = require('../utils')

const { expect } = chai

const completeOrder = rewire(path.resolve(__dirname, 'complete-order'))

describe('completeOrder', () => {
  let params
  let logger
  let eventHandler
  let engine
  let orderStub
  let revertOrderStub
  let revertDepositInvoiceStub
  let orderDepositInvoice
  let fillDepositInvoice
  let revertDepositRefundInvoiceStub
  let completeStub
  let fillStub
  let order
  let fill
  let revertFillStub
  let orderDepositRefundInvoice
  let fillDepositRefundInvoice
  let orderDepositPaymentRequest
  let fillDepositPaymentRequest
  let orderRefundPaymentRequest
  let fillRefundPaymentRequest
  let orderDepositInvoiceStub
  let fillDepositInvoiceStub
  let orderDepositRefundInvoiceStub
  let fillDepositRefundInvoiceStub
  let matchesHashStub
  let invoiceStub
  let revertInvoiceStub

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }
    eventHandler = { emit: sinon.stub() }
    orderDepositPaymentRequest = 'asdfasdf'
    fillDepositPaymentRequest = 'zxcvasdf'
    orderRefundPaymentRequest = 'asdf1234'
    fillRefundPaymentRequest = 'qwer1234'
    orderDepositInvoice = {settled: true, value: 200, paymentRequest: orderDepositPaymentRequest}
    fillDepositInvoice = {settled: true, value: 100, paymentRequest: fillDepositPaymentRequest}
    orderDepositRefundInvoice = {
      value: 200,
      markAsPaid: sinon.stub().withArgs('orderDepositPreimage').resolves(),
      paymentRequest: orderRefundPaymentRequest,
      paid: sinon.stub().returns(true)
    }
    fillDepositRefundInvoice = {
      value: 100,
      markAsPaid: sinon.stub().withArgs('fillDepositPreimage').resolves(),
      paymentRequest: fillRefundPaymentRequest,
      paid: sinon.stub().returns(true)
    }

    engine = {
      isInvoicePaid: sinon.stub(),
      getInvoiceValue: sinon.stub(),
      isBalanceSufficient: sinon.stub(),
      payInvoice: sinon.stub()
    }
    params = {
      orderId: '2',
      swapPreimage: 'asdf'
    }

    invoiceStub = {
      FOREIGN_TYPES: { FILL: 'FILL', ORDER: 'ORDER' },
      TYPES: { INCOMING: 'INCOMING', OUTGOING: 'OUTGOING' },
      PURPOSES: { FEE: 'FEE', DEPOSIT: 'DEPOSIT' }
    }

    completeStub = sinon.stub()
    matchesHashStub = sinon.stub().returns(true)
    fill = {fillId: '1', _id: 'asfd', payTo: 'ln:asdf1234', counterAmount: Big(1000), baseAmount: Big(100), order_id: '2', takerPayTo: 'ln:fdsa4321', matchesHash: matchesHashStub}
    order = {orderId: '2', _id: 'asfd', complete: completeStub, payTo: 'ln:asdf1234', counterAmount: Big(1000), baseAmount: Big(100), status: 'FILLED'}

    engine.isInvoicePaid.withArgs(orderDepositPaymentRequest).resolves(orderDepositInvoice.settled)
    engine.isInvoicePaid.withArgs(fillDepositPaymentRequest).resolves(fillDepositInvoice.settled)
    engine.getInvoiceValue.withArgs(orderDepositPaymentRequest).resolves(orderDepositInvoice.value)
    engine.getInvoiceValue.withArgs(fillDepositPaymentRequest).resolves(fillDepositInvoice.value)
    engine.getInvoiceValue.withArgs(orderRefundPaymentRequest).resolves(orderDepositRefundInvoice.value)
    engine.getInvoiceValue.withArgs(fillRefundPaymentRequest).resolves(fillDepositRefundInvoice.value)
    engine.isBalanceSufficient.withArgs('asdf1234', Big(1000), {outbound: true}).resolves(true)
    engine.isBalanceSufficient.withArgs('asdf1234', Big(100), {outbound: false}).resolves(true)
    engine.isBalanceSufficient.withArgs('fdsa4321', Big(1000), {outbound: true}).resolves(true)
    engine.isBalanceSufficient.withArgs('fdsa4321', Big(100), {outbound: false}).resolves(true)
    engine.payInvoice.withArgs(orderRefundPaymentRequest).resolves('orderDepositPreimage')
    engine.payInvoice.withArgs(fillRefundPaymentRequest).resolves('fillDepositPreimage')

    orderDepositInvoiceStub = {findOne: sinon.stub().resolves(orderDepositInvoice)}
    fillDepositInvoiceStub = {findOne: sinon.stub().resolves(fillDepositInvoice)}
    orderDepositRefundInvoiceStub = {findOne: sinon.stub().resolves(orderDepositRefundInvoice)}
    fillDepositRefundInvoiceStub = {findOne: sinon.stub().resolves(fillDepositRefundInvoice)}
    orderStub = { findOne: sinon.stub().resolves(order), STATUSES: { FILLED: 'FILLED' } }
    fillStub = { findOne: sinon.stub().resolves(fill), STATUSES: { ACCEPTED: 'ACCEPTED' } }
    revertFillStub = completeOrder.__set__('Fill', fillStub)
    revertOrderStub = completeOrder.__set__('Order', orderStub)
    revertDepositInvoiceStub = completeOrder.__set__('DepositInvoice', orderDepositInvoiceStub)
    revertDepositRefundInvoiceStub = completeOrder.__set__('DepositRefundInvoice', orderDepositRefundInvoiceStub)
    revertInvoiceStub = completeOrder.__set__('Invoice', invoiceStub)
  })

  afterEach(() => {
    revertOrderStub()
    revertDepositInvoiceStub()
    revertDepositRefundInvoiceStub()
    revertFillStub()
    revertInvoiceStub()
  })

  it('finds the order with the associated orderId', async () => {
    await completeOrder({ params, logger, eventHandler, engine })

    expect(orderStub.findOne).to.have.been.calledWith({ orderId: order.orderId })
  })

  it('throws an error if the order does not exist', () => {
    orderStub.findOne.resolves()
    return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.rejectedWith(`No order found with orderId: ${order.orderId}.`)
  })

  it('throws an error if the order is not in a filled status', () => {
    order.status = 'CANCELLED'
    return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.rejectedWith(`Cannot complete order ${order.orderId} in ${order.status} status.`)
  })

  it('finds the fill with the associated fill id', async () => {
    await completeOrder({ params, logger, eventHandler, engine })

    expect(fillStub.findOne).to.have.been.calledWith({ order_id: order._id, status: fillStub.STATUSES.ACCEPTED })
  })

  it('throws an error if the fill does not exist', () => {
    fillStub.findOne.resolves()
    return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.rejectedWith(`No accepted fill found for order ${order.orderId}.`)
  })

  it('checks if the fill preimage hashed matches the fill swaphash', async () => {
    await completeOrder({ params, logger, eventHandler, engine })

    expect(matchesHashStub).to.have.been.calledWith(params.swapPreimage)
  })

  it('throws an error if the fill preimage does not hash to the swapHash', async () => {
    fill.matchesHash = sinon.stub().returns(false)
    return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.rejectedWith(`Hash does not match preimage for Order ${order.orderId}.`)
  })

  it('finds the deposit invoice with the associated order id', async () => {
    await completeOrder({ params, logger, eventHandler, engine })

    expect(orderDepositInvoiceStub.findOne).to.have.been.calledWith({foreignId: 'asfd'})
  })

  it('raises an error if there is no deposit invoice associated with the order id', async () => {
    orderDepositInvoiceStub.findOne.resolves(null)
    const errorMessage = `Cound not find DepositInvoice for ${order.orderId}`

    return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('finds the deposit refund invoice with the associated order id', async () => {
    await completeOrder({ params, logger, eventHandler, engine })

    expect(orderDepositRefundInvoiceStub.findOne).to.have.been.calledWith(
      { foreignId: 'asfd', foreignType: 'ORDER', purpose: 'DEPOSIT', type: 'OUTGOING' }
    )
  })

  it('raises an error if there is no deposit refund invoice associated with the order id', async () => {
    orderDepositRefundInvoiceStub.findOne.resolves(null)
    const errorMessage = `Cound not find DepositRefundInvoice for ${order.orderId}`

    return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('checks if the order deposit invoice has been paid', async () => {
    await completeOrder({ params, logger, eventHandler, engine })

    expect(engine.isInvoicePaid).to.have.been.calledWith(orderDepositPaymentRequest)
  })

  it('throws an error if the order deposit invoice has not been paid', async () => {
    engine.isInvoicePaid.withArgs(orderDepositInvoice.paymentRequest).resolves(false)

    const errorMessage = 'Deposit Invoice for Order 2 has not been paid.'

    return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('fetches the order deposit payment request details from the engine', async () => {
    await completeOrder({ params, logger, eventHandler, engine })

    expect(engine.getInvoiceValue).to.have.been.calledWith(orderDepositInvoice.paymentRequest)
  })

  it('fetches the order deposit refund payment request details from the engine', async () => {
    await completeOrder({ params, logger, eventHandler, engine })

    expect(engine.getInvoiceValue).to.have.been.calledWith(orderDepositRefundInvoice.paymentRequest)
  })

  it('throws an error if the order deposit invoice value is not equal to the order deposit refund invoice value', async () => {
    const orderDepositInvoiceValue = {value: 1000}
    engine.getInvoiceValue.withArgs(orderDepositInvoice.paymentRequest).resolves(orderDepositInvoiceValue)

    const errorMessage = `Deposit Invoice Refund value is not the same as Deposit Invoice value. Order id: 2`

    return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.be.rejectedWith(errorMessage)
  })

  it('refunds the invoice if the invoice has not been refunded', async () => {
    orderDepositRefundInvoice.paid = sinon.stub().returns(false)
    await completeOrder({ params, logger, eventHandler, engine })

    expect(engine.payInvoice).to.have.been.calledWith(orderDepositRefundInvoice.paymentRequest)
    expect(orderDepositRefundInvoice.markAsPaid).to.have.been.calledWith('orderDepositPreimage')
  })

  it('does not refund the invoice if the invoice has already been refunded', async () => {
    await completeOrder({ params, logger, eventHandler, engine })

    expect(engine.payInvoice).to.have.not.been.calledWith(orderDepositRefundInvoice.paymentRequest)
    expect(orderDepositRefundInvoice.markAsPaid).to.have.not.been.calledWith('orderDepositPreimage')
  })

  describe('fill deposit invoices', () => {
    beforeEach(() => {
      revertDepositInvoiceStub = completeOrder.__set__('DepositInvoice', fillDepositInvoiceStub)
      revertDepositRefundInvoiceStub = completeOrder.__set__('DepositRefundInvoice', fillDepositRefundInvoiceStub)
    })

    it('finds the deposit invoice with the associated order id', async () => {
      await completeOrder({ params, logger, eventHandler, engine })

      expect(fillDepositInvoiceStub.findOne).to.have.been.calledWith({foreignId: 'asfd'})
    })

    it('raises an error if there is no deposit invoice associated with the order id', async () => {
      fillDepositInvoiceStub.findOne.resolves(null)
      const errorMessage = `Cound not find DepositInvoice for ${order.orderId}`

      return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.be.rejectedWith(errorMessage)
    })

    it('finds the deposit refund invoice with the associated order id', async () => {
      await completeOrder({ params, logger, eventHandler, engine })

      expect(fillDepositRefundInvoiceStub.findOne).to.have.been.calledWith({ foreignId: 'asfd', foreignType: 'FILL', purpose: 'DEPOSIT', type: 'OUTGOING' })
    })

    it('raises an error if there is no deposit refund invoice associated with the order id', async () => {
      fillDepositRefundInvoiceStub.findOne.resolves(null)
      const errorMessage = `Cound not find DepositRefundInvoice for ${order.orderId}`

      return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.be.rejectedWith(errorMessage)
    })

    it('checks if the order deposit invoice has been paid', async () => {
      await completeOrder({ params, logger, eventHandler, engine })

      expect(engine.isInvoicePaid).to.have.been.calledWith(fillDepositPaymentRequest)
    })

    it('throws an error if the fill deposit invoice has not been paid', async () => {
      engine.isInvoicePaid.withArgs(fillDepositPaymentRequest).resolves(false)

      const errorMessage = 'Deposit Invoice for Order 2 has not been paid.'

      return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.be.rejectedWith(errorMessage)
    })

    it('fetches the fill deposit payment request details from the engine', async () => {
      await completeOrder({ params, logger, eventHandler, engine })

      expect(engine.getInvoiceValue).to.have.been.calledWith(fillDepositInvoice.paymentRequest)
    })

    it('fetches the fill deposit refund payment request details from the engine', async () => {
      await completeOrder({ params, logger, eventHandler, engine })

      expect(engine.getInvoiceValue).to.have.been.calledWith(fillDepositRefundInvoice.paymentRequest)
    })

    it('throws an error if the fill deposit invoice value is not equal to the fill deposit refund invoice value', async () => {
      const feeRefundInvoice = {value: 1000}
      engine.getInvoiceValue.withArgs(fillDepositPaymentRequest).resolves(feeRefundInvoice)

      const errorMessage = `Deposit Invoice Refund value is not the same as Deposit Invoice value. Order id: 2`

      return expect(completeOrder({ params, logger, eventHandler, engine })).to.eventually.be.rejectedWith(errorMessage)
    })

    it('refunds the invoice if the invoice has not been refunded', async () => {
      fillDepositRefundInvoice.paid = sinon.stub().returns(false)
      await completeOrder({ params, logger, eventHandler, engine })

      expect(engine.payInvoice).to.have.been.calledWith(fillDepositRefundInvoice.paymentRequest)
      expect(fillDepositRefundInvoice.markAsPaid).to.have.been.calledWith('fillDepositPreimage')
    })

    it('does not refund the invoice if the invoice has already been refunded', async () => {
      await completeOrder({ params, logger, eventHandler, engine })

      expect(engine.payInvoice).to.have.not.been.calledWith(fillDepositRefundInvoice.paymentRequest)
      expect(fillDepositRefundInvoice.markAsPaid).to.have.not.been.calledWith('fillDepositPreimage')
    })
  })

  it('completes the order', async () => {
    await completeOrder({ params, logger, eventHandler, engine })

    expect(completeStub).to.have.been.called()
  })

  it('emits an order:completed event', async () => {
    await completeOrder({ params, logger, eventHandler, engine })

    expect(eventHandler.emit).to.have.been.calledWith('order:completed')
  })

  it('returns an empty object', async () => {
    const res = await completeOrder({ params, logger, eventHandler, engine })

    expect(res).to.eql({})
  })
})
