const path = require('path')
const { chai, rewire, sinon } = require('test/test-helper')
const bigInt = require('big-integer')

const { expect } = chai

const invoicePath = path.resolve(__dirname, 'generate-invoices')
console.log(invoicePath)
const generateInvoices = rewire(invoicePath)

console.log(generateInvoices)
describe('generateInvoices', () => {
  let amount
  let id
  let _id
  let foreignType
  let engine
  let feeInvoiceStub
  let depositInvoiceStub
  let revertDepositInvoicestub
  let revertFeeInvoiceStub
  let logger

  beforeEach(() => {
    amount = bigInt(100)
    id = '1234'
    _id = '1'
    foreignType = 'ORDER'
    logger = { info: sinon.stub() }
    engine = {createInvoice: sinon.stub().returns('1234')}

    feeInvoiceStub = { create: sinon.stub().returns({foreignType}) }
    depositInvoiceStub = { create: sinon.stub().returns({foreignType}) }

    revertDepositInvoicestub = generateInvoices.__set__('DepositInvoice', depositInvoiceStub)
    revertFeeInvoiceStub = generateInvoices.__set__('FeeInvoice', feeInvoiceStub)
  })

  afterEach(() => {
    revertDepositInvoicestub()
    revertFeeInvoiceStub()
  })

  it('creates deposit and fee invoices in the engine', () => {
    generateInvoices(amount, id, _id, engine, foreignType, logger)

    expect(engine.createInvoice).to.have.been.calledTwice()
    expect(engine.createInvoice).to.have.been.calledWith('1234', 120, 1000)
    expect(engine.createInvoice).to.have.been.calledWith('1234', 120, 1000)
  })

  it('creates fee and deposit invoices in the database for orders', async () => {
    await generateInvoices(amount, id, _id, engine, foreignType, logger)

    expect(feeInvoiceStub.create).to.have.been.calledWith({ foreignId: '1', paymentRequest: '1234', foreignType: 'ORDER' })
    expect(depositInvoiceStub.create).to.have.been.calledWith({ foreignId: '1', paymentRequest: '1234', foreignType: 'ORDER' })
  })

  it('returns the deposit and fee invoice records for orders', async () => {
    const res = await generateInvoices(amount, id, _id, engine, foreignType, logger)

    expect(res).to.eql([{foreignType: 'ORDER'}, {foreignType: 'ORDER'}])
  })

  it('creates fee and deposit invoices in the database for fills', async () => {
    feeInvoiceStub.create.returns({foreignType: 'FILL'})
    depositInvoiceStub.create.returns({foreignType: 'FILL'})
    await generateInvoices(amount, id, _id, engine, 'FILL', logger)

    expect(feeInvoiceStub.create).to.have.been.calledWith({ foreignId: '1', paymentRequest: '1234', foreignType: 'FILL' })
    expect(depositInvoiceStub.create).to.have.been.calledWith({ foreignId: '1', paymentRequest: '1234', foreignType: 'FILL' })
  })

  it('returns the deposit and fee invoice records for fills', async () => {
    feeInvoiceStub.create.returns({foreignType: 'FILL'})
    depositInvoiceStub.create.returns({foreignType: 'FILL'})
    const res = await generateInvoices(amount, id, _id, engine, 'FILL', logger)

    expect(res).to.eql([{foreignType: 'FILL'}, {foreignType: 'FILL'}])
  })
})
