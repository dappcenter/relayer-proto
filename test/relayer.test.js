import Relayer from '../src/relayer'
import path from 'path'
import assert from 'assert'
import delay from 'timeout-as-promise'
import createStub from './stub'
import createSeeds from './seed'
import uuid from 'uuid/v4'

describe('Relayer', function () {
	let relayer
	let seeds

	before( async function () {
		seeds = await createSeeds()
		relayer = new Relayer(path.join(__dirname, 'testdb'))
		relayer.listen()
		await delay(1000)
	})

	describe('#listen', function () {
		it.skip('should bind to the port and interface', async function () {
			// TODO: check that it's bound to the port
		})
	})

	describe('#getOrders', function () {
		it('should return all current orders', async function () {
			let stub = createStub('localhost:50078')

			stub.getOrders({
				baseSymbol: 'BTC',
				counterSymbol: 'LTC'
			}, function (err, orders) {
				assert.ifError(err)
				assert.equal(orders.length, 2)
			})
		})

		it('should include relevant order info', async function () {
			let stub = createStub('localhost:50078')

			stub.getOrders({
				baseSymbol: 'BTC',
				counterSymbol: 'LTC'
			}, function (err, orderUpdates) {
				assert.ifError(err)

				const keys = Object.keys(orderUpdates[0])

				assert.equal(keys.length, 3)
				assert.deepEqual(keys, ['orderId', 'orderStatus', 'order'])

				const orderKeys = Object.keys(orderUpdates[0].order)

				assert.equal(orderKeys.length, 5)
				assert.deepEqual(orderKeys, ['baseSymbol', 'counterSymbol', 'baseAmount', 'counterAmount', 'side'])
			})
		})
	})

	describe('#subscribeOrders', function () {
		// let stub = createStub('localhost:50078')

		// let call = stub.subscribeOrders({
		// 	baseSymbol: 'BTC',
		// 	counterSymbol: 'LTC'
		// })

		// call.on('')

		it('represents numbers larger than javascript\'s max')
	})

	describe('#maker', function () {
		let call

		beforeEach(function () {
			let stub = createStub('localhost:50078')
			call = stub.maker()
		})

		it('responds with an error if sent something invalid', function (done) {

			call.on('data', function () {})

			call.on('error', function (err) {
				assert.equal(err.details, "No order with id 123")
				done()
			})

			call.write({
				orderId: '123',
				cancelOrderRequest: {}
			})
		})

		describe.only('placeOrder', function () {

			it('creates an order and returns the id', function (done) {

				const order = {
					"baseSymbol": "BTC",
					"counterSymbol": "LTC",
					"baseAmount": "50000",
					"counterAmount": "2000000",
					"side": "BID",
					"payTo": "ln:8912312345"
				}

				const orderId = uuid()

				call.on('error', function (err) {
					assert.ifError(err)
					done()
				})

				call.on('data', function (msg) {
					assert.ok(msg)

					const msgKeys = Object.keys(msg)
					assert.deepEqual(msgKeys, ['orderId',
						'orderStatus',
						'placeOrderResponse',
						'cancelOrderResponse',
						'executeOrderRequest',
						'completeOrderResponse'
					])
					assert.equal(msg.orderId, orderId)
					assert.equal(msg.orderStatus, 'PLACED')

					assert.equal(msg.cancelOrderResponse, null)
					assert.equal(msg.executeOrderRequest, null)
					assert.equal(msg.completeOrderResponse, null)

					const { placeOrderResponse } = msg
					const placeOrderResponseKeys = Object.keys(placeOrderResponse)
					assert.deepEqual(placeOrderResponseKeys, [])

					call.end()
				})

				call.on('end', function () {
					done()
				})

				call.write({
					orderId: orderId,
					placeOrderRequest: {
						order
					}
				})
			})
		})

		describe('cancelOrder', function () {

			it('cancels an order', function (done) {

				let seed = seeds[0]

				call.on('error', function (err) {
					assert.ifError(err)
					done()
				})

				call.on('data', function (msg) {
					assert.ok(msg)

					const msgKeys = Object.keys(msg)
					assert.deepEqual(msgKeys, ['orderId',
						'orderStatus',
						'placeOrderResponse',
						'cancelOrderResponse',
						'executeOrderRequest',
						'completeOrderResponse'
					])
					assert.equal(msg.orderId, seed)
					assert.equal(msg.orderStatus, 'CANCELLED')

					assert.equal(msg.placeOrderResponse, null)
					assert.equal(msg.executeOrderRequest, null)
					assert.equal(msg.completeOrderResponse, null)

					const { cancelOrderResponse } = msg
					const cancelOrderResponseKeys = Object.keys(cancelOrderResponse)
					assert.deepEqual(cancelOrderResponseKeys, [])

					call.end()
				})

				call.on('end', function () {
					done()
				})

				call.write({
					orderId: seed,
					cancelOrderRequest: {}
				})
			})
		})

		describe('executeOrder', function () {

		})

		describe('completeOrder', function () {

		})

	})

	describe ('#taker', function () {
		describe('fillOrder', function () {

		})
	})
})