/*
 * Wrapper for the redis client that promisifies the asynchronous functions
 *
 * @author kinesis
 */

const { promisify } = require('util')
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'

const redis = require('redis')

function createRedisClient (options = {}) {
  const redisOptions = Object.assign({ host: REDIS_HOST }, options)
  const client = redis.createClient(redisOptions)

  return {
    subscribe: client.subscribe.bind(client),
    unsubscribe: client.unsubscribe.bind(client),
    on: client.on.bind(client),
    publish: client.publish.bind(client),
    get: promisify(client.get.bind(client)),
    set: promisify(client.set.bind(client)),
    exists: promisify(client.exists.bind(client))
  }
}

module.exports = createRedisClient
