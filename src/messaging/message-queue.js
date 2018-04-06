/**
 * Single process message queue with a promise interface for the next
 * available message
 *
 * @author kinesis
 *
 */

const EventEmitter = require('events');

class MessageQueue extends EventEmitter {
  constructor() {
    this._queue = [];
    this._listeners = [];

    this.on('enqueue', () => {
      if(this._listeners.length) {
        const item = this.dequeue();
        let listener
        while(this._listeners.length) {
          listener = this._listeners.shift();
          listener(item);
        }
      }
    });
  }

  enqueue(item) {
    this._queue.push(item);
    this.emit('enqueue');
  }

  dequeue() {
    const item = this._queue.shift();
    this.emit('dequeue', item);
    return item;
  }

  // TODO: a way for listeners to take themselves out
  next() {
    return new Promise((resolve, reject) => {
      if(this._queue.length) {
        return resolve(this.dequeue());
      }
      this._listeners.push(resolve);
    });
  }
}

module.exports = MessageQueue;
