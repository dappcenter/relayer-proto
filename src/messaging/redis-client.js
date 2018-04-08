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
  constructor() {
    this.client = redis.createClient();

    COMMANDS.forEach((command) => {
      this[command] = promisify(this.client[command]);
    });

    this.on = this.client.on.bind(this.client);
    this.psubscribe = this.client.psubscribe.bind(this);
  }
}

module.exports = RedisClient;
