/*
 * Wrapper for the redis client that promisifies the asynchronous functions
 *
 * @author kinesis
 */

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'

const redis = require('redis')

const COMMANDS = [
  'get',
  'set',
  'exists'
]

class RedisClient {
  constructor (options = {}) {
    const redisOptions = Object.assign({ host: REDIS_HOST }, options)
    this.client = redis.createClient(redisOptions)

    COMMANDS.forEach((command) => {
      this[command] = (key) => this.promisify(key, this.client[command].bind(this.client))
    })

    this.on = this.client.on.bind(this.client)
    this.psubscribe = this.client.psubscribe.bind(this.client)
    this.punsubscribe = this.client.punsubscribe.bind(this.client)
  }

  promisify (key, fn) {
    return new Promise((resolve, reject) => {
      fn(key, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }
}

module.exports = RedisClient
