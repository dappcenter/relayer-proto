/**
 * Set and retrieve messages from other processes
 *
 * @author kinesis
 *
 */

const createRedisClient = require('./redis-client')
const EventEmitter = require('events')

const MESSAGEBOX_CHANNEL = 'messagebox-set'

class MessageBox extends EventEmitter {
  constructor (redisOptions) {
    super()
    this._client = createRedisClient(redisOptions)
    this._subscriber = createRedisClient(redisOptions)
    this._subscriber.on('message', async (channel, message) => {
      if (channel === MESSAGEBOX_CHANNEL) {
        this.emit(`set:${message}`)
      }
    })
    this._subscriber.subscribe(MESSAGEBOX_CHANNEL)
  }

  async set (key, item) {
    await this._client.set(key, item)
    this._client.publish(MESSAGEBOX_CHANNEL, key)
  }

  async get (key) {
    return new Promise(async (resolve, reject) => {
      try {
        if (await this._client.exists(key)) {
          return resolve(this.retrieve(key))
        }

        return resolve(await this.nextAtKey(key))
      } catch (e) {
        reject(e)
      }
    })
  }

  async retrieve (key) {
    return this._client.get(key)
  }

  nextAtKey (key) {
    return new Promise((resolve, reject) => {
      this.once(`set:${key}`, async () => {
        try {
          resolve(await this.retrieve(key))
        } catch (e) {
          reject(e)
        }
      })
    })
  }
}

module.exports = MessageBox
