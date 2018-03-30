import path from 'path'
import orders from './fixtures'
import uuid from 'uuid/v4'
import levelup from 'levelup'
import leveldown from 'leveldown'

const storage = levelup(leveldown(path.join(__dirname, 'testdb', 'open')))

async function createSeeds() {
	let seeds = {
		placed: [],
		filling: [],
		filled: [],
		cancelled: []
	}
	await Promise.all(orders.map( (order) => {
		const id = uuid()
		seeds[order.status.toLowerCase()].push({ orderId: id, order })
		return storage.put(id, JSON.stringify(order))
	}))

	await storage.close()
	return seeds
}

export default createSeeds