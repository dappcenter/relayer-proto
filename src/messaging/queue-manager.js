/**
 * Manager of message queues
 *
 * @author kinesis
 *
 */

const MessageQueue = require('./message-queue');

class QueueManager {
  constructor() {
    this.queues = new Map();
  }

  get(key) {
    if (!this.queues.has(key)) {
      this.queues.set(key, new MessageQueue());
    }
    return this.queues.get(key);
  }

  remove(key) {
    return this.queues.delete(key);
  }
}

module.exports = QueueManager;
