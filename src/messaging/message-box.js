/**
 * Set and retrieve messages from other processes
 *
 * @author kinesis
 *
 */

const RedisClient = require('./redis-client')
const EventEmitter = require('events')

class MessageBox extends EventEmitter {
  constructor (redisOptions) {
    super()
    this._client = new RedisClient(redisOptions)
    this._subscriber = new RedisClient(redisOptions)
    this._subscriber.on('pmessage', async (pattern, channel, message) => {
      if (message === 'set') {
        // channels for this subscription are in the form of '__keyspace@<db>__:<key>'
        // the below extracts the name of the key from the channel, but preserves any
        // colon (:) characters that may be in the key.
        // e.g. '__keyspace@0__:abc' -> 'abc'
        // e.g. '__keyspace@0__:custom_namespace:abc' -> 'custom_namespace:abc'
        const key = channel.split(':').slice(1).join(':')
        this.emit(`set:${key}`)
      }
    })
  }

  async set (key, item) {
    return this._client.set(key, item)
  }

  async get (key) {
    return new Promise(async (resolve) => {
      const keyExists = await this._client.exists(key)
      let item
      if (keyExists) {
        item = await this.retrieve(key)
      } else {
        item = await this.nextAtKey(key)
      }

      return resolve(item)
    })
  }

  async retrieve (key) {
    return this._client.get(key)
  }

  nextAtKey (key) {
    const pattern = `__keyspace@*__:${key}`

    return new Promise((resolve) => {
      this.once(`set:${key}`, async () => {
        this._subscriber.punsubscribe(pattern)
        resolve(await this.retrieve(key))
      })

      this._subscriber.psubscribe(pattern)
    })
  }
}

module.exports = MessageBox
