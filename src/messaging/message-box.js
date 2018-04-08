/**
 * Set and retrieve messages from other processes
 *
 * @author kinesis
 *
 */

const RedisClient = require('./redis-client');

class MessageBox {
  constructor() {
    this._client = new RedisClient();
  }

  async set(key, item) {
    return this._client.rpush(this.key, item);
  }

  async get(key) {
    return new Promise(async (resolve) => {
      const keyExists = await this._client.exists(key);
      let item;
      if (keyExists) {
        item = await this.retrieve(key);
      } else {
        item = await this.nextAtKey(key);
      }

      return resolve(item);
    });
  }

  async retrieve(key) {
    return this._client.get(key);
  }

  nextAtKey(key) {
    const subscriber = new RedisClient();
    const pattern = `__keyspace@*__:${key}`;

    return new Promise((resolve) => {
      subscriber.on('pmessage', async (_p, _c, message) => {
        if (message === 'set') {
          subscriber.punsubscribe(pattern);
          subscriber.quit();
          // won't this be a race condition if there are multiple subscribers?
          // one of them will get the item, others will get nada?
          resolve(await this.retrieve(key));
        }
      });

      subscriber.psubscribe(pattern);
    });
  }
}

module.exports = MessageBox;
