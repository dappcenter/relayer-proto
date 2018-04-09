/*
 * Wrapper for the redis client that promisifies the asynchronous functions
 *
 * @author kinesis
 */


const redis = require('redis');
const { promisify } = require('util');

const COMMANDS = [
  'get',
  'set',
  'exists',
];

class RedisClient {
  constructor(options) {
    this.client = redis.createClient(options);

    COMMANDS.forEach((command) => {
      this[command] = promisify(this.client[command].bind(this.client));
    });

    this.on = this.client.on.bind(this.client);
    this.psubscribe = this.client.psubscribe.bind(this.client);
    this.punsubscribe = this.client.punsubscribe.bind(this.client);
  }
}

module.exports = RedisClient;
