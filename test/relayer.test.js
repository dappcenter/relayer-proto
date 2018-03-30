import Relayer from '../src/relayer'
import path from 'path'
import assert from 'assert'
import delay from 'timeout-as-promise'
import createStub from './stub'
import createSeeds from './seed'
import uuid from 'uuid/v4'
import { BigNumber } from 'bignumber.js'

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
				assert.strictEqual(orders.length, 2)
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

				assert.strictEqual(keys.length, 3)
				assert.deepStrictEqual(keys, ['orderId', 'orderStatus', 'order'])

				const orderKeys = Object.keys(orderUpdates[0].order)

				assert.strictEqual(orderKeys.length, 5)
				assert.deepStrictEqual(orderKeys, ['baseSymbol', 'counterSymbol', 'baseAmount', 'counterAmount', 'side'])
			})
		})
	})

	describe('#subscribeOrders', function () {

		it('sends new orders to subscribers', function (done) {

			const order = {
				"baseSymbol": "BTC",
				"counterSymbol": "LTC",
				"baseAmount": "60000",
				"counterAmount": "8000000",
				"side": "ASK",
				"payTo": "ln:8917819845"
			}

			const orderId = uuid()

			const stub = createStub('localhost:50078')

			let call = stub.subscribeOrders({
				baseSymbol: 'BTC',
				counterSymbol: 'LTC'
			})

			call.on('data', function (orderUpdate) {
				const orderUpdateKeys = Object.keys(orderUpdate)

				assert.strictEqual(orderUpdateKeys.length, 4)

				assert.strictEqual(orderUpdate.orderId, orderId)
				assert.strictEqual(orderUpdate.orderStatus, 'PLACED')
				// TODO: not sure that I like fillAmount being on these orders when they are not filled...
				assert.strictEqual(orderUpdate.fillAmount, '0')

				const orderKeys = Object.keys(orderUpdate.order)

				assert.strictEqual(orderKeys.length, 5)
				assert.strictEqual(orderUpdate.order.baseSymbol, order.baseSymbol)
				assert.strictEqual(orderUpdate.order.counterSymbol, order.counterSymbol)
				assert.strictEqual(orderUpdate.order.baseAmount, order.baseAmount)
				assert.strictEqual(orderUpdate.order.counterAmount, order.counterAmount)
				assert.strictEqual(orderUpdate.order.side, order.side)

				call.cancel()
			})

			call.on('error', function (err) {
				assert.strictEqual(err.code, 1)
				assert.strictEqual(err.details, 'Cancelled')
				done()
			})

			setTimeout(function () {
				relayer._placeOrder(orderId, { order }).catch(done)
			}, 50)
		})

		it('sends cancels to subscribers', function (done) {
			const stub = createStub('localhost:50078')
			const { orderId, order } = seeds.placed.pop()

			let call = stub.subscribeOrders({
				baseSymbol: 'BTC',
				counterSymbol: 'LTC'
			})

			call.on('data', function (orderUpdate) {
				const orderUpdateKeys = Object.keys(orderUpdate)

				assert.strictEqual(orderUpdateKeys.length, 4)

				assert.strictEqual(orderUpdate.orderId, orderId)
				assert.strictEqual(orderUpdate.orderStatus, 'CANCELLED')
				assert.strictEqual(orderUpdate.fillAmount, '0')
				assert.strictEqual(orderUpdate.order, null)

				call.cancel()
			})

			call.on('error', function (err) {
				assert.strictEqual(err.code, 1)
				assert.strictEqual(err.details, 'Cancelled')
				done()
			})

			setTimeout(function () {
				relayer._cancelOrder(orderId).catch(done)
			}, 50)
		})

		it('sends fills to subscribers', function (done) {
			const stub = createStub('localhost:50078')
			const order = {
				"baseSymbol": "BTC",
				"counterSymbol": "LTC",
				"baseAmount": "50000",
				"counterAmount": "2000000",
				"side": "ASK"
			}

			const orderId = uuid()

			let call = stub.subscribeOrders({
				baseSymbol: 'BTC',
				counterSymbol: 'LTC'
			})

			const makerStub = createStub('localhost:50078')
			const makerCall = makerStub.maker()

			makerCall.write({
				orderId: orderId,
				placeOrderRequest: {
					order,
					"payTo": "ln:8912312345"
				}
			})

			let callCount = 0

			call.on('data', function (orderUpdate) {
				callCount++

				if(callCount === 1) return

				const orderUpdateKeys = Object.keys(orderUpdate)

				console.log(order, orderId, orderUpdate)

				assert.strictEqual(orderUpdateKeys.length, 4)

				assert.strictEqual(orderUpdate.orderId, orderId)
				assert.strictEqual(orderUpdate.orderStatus, 'FILLED')
				assert.strictEqual(orderUpdate.fillAmount, (new BigNumber(order.baseAmount)).dividedBy(10).toFixed(0))
				assert.strictEqual(orderUpdate.order, null)

				call.cancel()

				makerCall.cancel()
			})

			call.on('error', function (err) {
				assert.strictEqual(err.code, 1)
				assert.strictEqual(err.details, 'Cancelled')
				done()
			})

			setTimeout(function () {

				relayer._fillOrder(orderId, {
					fill: {
						swapHash: "anVzdCB0ZXN0aW5n",
						fillAmount: (new BigNumber(order.baseAmount)).dividedBy(10).toFixed(0)
					}
				}).catch(done)
			}, 50)
		})

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
				assert.strictEqual(err.details, "No order with id 123")
				done()
			})

			call.write({
				orderId: '123',
				cancelOrderRequest: {}
			})
		})

		describe('placeOrder', function () {

			it('creates an order and returns the id', function (done) {

				const order = {
					"baseSymbol": "BTC",
					"counterSymbol": "LTC",
					"baseAmount": "50000",
					"counterAmount": "2000000",
					"side": "BID"
				}

				const orderId = uuid()

				call.on('error', function (err) {
					assert.ifError(err)
					done()
				})

				call.on('data', function (msg) {
					assert.ok(msg)

					const msgKeys = Object.keys(msg)
					assert.deepStrictEqual(msgKeys, ['orderId',
						'orderStatus',
						'placeOrderResponse',
						'cancelOrderResponse',
						'executeOrderRequest',
						'completeOrderResponse'
					])
					assert.strictEqual(msg.orderId, orderId)
					assert.strictEqual(msg.orderStatus, 'PLACED')

					assert.strictEqual(msg.cancelOrderResponse, null)
					assert.strictEqual(msg.executeOrderRequest, null)
					assert.strictEqual(msg.completeOrderResponse, null)

					const { placeOrderResponse } = msg
					const placeOrderResponseKeys = Object.keys(placeOrderResponse)
					assert.deepStrictEqual(placeOrderResponseKeys, [])

					call.end()
				})

				call.on('end', function () {
					done()
				})

				call.write({
					orderId: orderId,
					placeOrderRequest: {
						order,
						"payTo": "ln:8912312345"
					}
				})
			})
		})

		describe('cancelOrder', function () {

			it('cancels an order', function (done) {

				let seed = seeds.placed.pop().orderId

				call.on('error', function (err) {
					assert.ifError(err)
					done()
				})

				call.on('data', function (msg) {
					assert.ok(msg)

					const msgKeys = Object.keys(msg)
					assert.deepStrictEqual(msgKeys, [
						'orderId',
						'orderStatus',
						'placeOrderResponse',
						'cancelOrderResponse',
						'executeOrderRequest',
						'completeOrderResponse'
					])
					assert.strictEqual(msg.orderId, seed)
					assert.strictEqual(msg.orderStatus, 'CANCELLED')

					assert.strictEqual(msg.placeOrderResponse, null)
					assert.strictEqual(msg.executeOrderRequest, null)
					assert.strictEqual(msg.completeOrderResponse, null)

					const { cancelOrderResponse } = msg
					const cancelOrderResponseKeys = Object.keys(cancelOrderResponse)
					assert.deepStrictEqual(cancelOrderResponseKeys, [])

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
			it('requests execution for placed orders', function (done) {
				const order = {
					"baseSymbol": "BTC",
					"counterSymbol": "LTC",
					"baseAmount": "50000",
					"counterAmount": "2000000",
					"side": "ASK"
				}
				const payTo = "ln:8912312345"
				const fill = {
					swapHash: "SWYgeW91IHRoaW5rIHRoaXMgaGFzIGEgaGFwcHkgZW5kaW5nLCB5b3UgaGF2ZW4ndCBiZWVuIHBheWluZyBhdHRlbnRpb24=",
					fillAmount: (new BigNumber(order.baseAmount)).dividedBy(10).toFixed(0)
				}

				const orderId = uuid()

				call.on('error', done)
				call.on('end', done)
				call.on('data', function (msg) {
					if(msg.executeOrderRequest) {
						assert.deepStrictEqual(Object.keys(msg), [
							'orderId',
							'orderStatus',
							'placeOrderResponse',
							'cancelOrderResponse',
							'executeOrderRequest',
							'completeOrderResponse'
						])
						assert.strictEqual(msg.orderId, orderId)
						assert.strictEqual(msg.orderStatus, 'FILLING')

						assert.strictEqual(msg.placeOrderResponse, null)
						assert.strictEqual(msg.cancelOrderResponse, null)
						assert.strictEqual(msg.completeOrderResponse, null)

						assert.deepStrictEqual(msg.executeOrderRequest, { fill })

						call.end()
					}
				})

				call.write({
					orderId: orderId,
					placeOrderRequest: {
						order,
						payTo
					}
				})

				const takerStub = createStub('localhost:50078')
				const takerCall = takerStub.taker()

				setTimeout(function () {
					takerCall.write({
						orderId,
						fillOrderRequest: {
							fill
						}
					})
				}, 1000)
			})
		})

		describe('completeOrder', function () {

		})

	})

	describe('#taker', function () {
		describe('fillOrder', function () {

			it('fills orders that have been placed', function (done) {
				const order = {
					"baseSymbol": "BTC",
					"counterSymbol": "LTC",
					"baseAmount": "50000",
					"counterAmount": "2000000",
					"side": "ASK"
				}
				const payTo = "ln:8912312345"

				const orderId = uuid()

				const makerStub = createStub('localhost:50078')
				const makerCall = makerStub.maker()

				makerCall.on('data', function (msg) {
					if(msg.executeOrderRequest) {
						makerCall.write({
							orderId: orderId,
							executeOrderResponse: {}
						})
					}
				})

				makerCall.write({
					orderId: orderId,
					placeOrderRequest: {
						order,
						payTo
					}
				})

				const stub = createStub('localhost:50078')
				const call = stub.taker()

				call.on('error', done)
				call.on('end', done)
				call.on('data', function (msg) {
					const msgKeys = Object.keys(msg)
					assert.deepStrictEqual(msgKeys, [
						'orderId',
						'fillOrderResponse'
					])
					assert.strictEqual(msg.orderId, orderId)

					const { fillOrderResponse } = msg
					const fillOrderResponseKeys = Object.keys(fillOrderResponse)
					assert.deepStrictEqual(fillOrderResponseKeys, [ 'payTo' ])
					assert.deepEqual(fillOrderResponse.payTo, payTo)

					call.end()
				})

				setTimeout(function () {
					call.write({
						orderId: orderId,
						fillOrderRequest: {
							fill: {
								swapHash: "SWYgeW91IHRoaW5rIHRoaXMgaGFzIGEgaGFwcHkgZW5kaW5nLCB5b3UgaGF2ZW4ndCBiZWVuIHBheWluZyBhdHRlbnRpb24=",
								fillAmount: (new BigNumber(order.baseAmount)).dividedBy(10).toFixed(0)
							}
						}
					})
				}, 1000)
			})
		})
	})
})