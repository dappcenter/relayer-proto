const assert = require('assert');
const mock = require('mock-require');
const { expect } = require('chai');

const redis = {
  store: {},
  listeners: {},
  patterns: [],
  storeAndTrigger(key, value) {
    process.nextTick(() => {
      redis.store[key] = value;

      redis.listeners.pmessage.forEach((fn) => {
        fn.call(null, `__keyspace@*__:${key}`, `__keyspace@0__:${key}`, 'set');
      });
    });
  },
  createClient() {
    return {
      store: this.store,
      listeners: this.listeners,
      patterns: this.patterns,
      get(key, cb) {
        const value = this.store[key];

        process.nextTick(() => {
          cb(null, value);
        });
      },
      set(key, value, cb) {
        this.store[key] = value;

        process.nextTick(cb);
      },
      exists(key, cb) {
        const exists = Object.prototype.hasOwnProperty.call(this.store, key);

        process.nextTick(() => {
          cb(null, exists);
        });
      },
      on(evt, fn) {
        this.listeners[evt] = this.listeners[evt] || [];
        this.listeners[evt].push(fn);
      },
      psubscribe(pattern) {
        if (this.patterns.indexOf(pattern) === -1) {
          this.patterns.push(pattern);
        }
      },
      punsubscribe(pattern) {
        if (this.patterns.indexOf(pattern) !== -1) {
          this.patterns.splice(this.patterns.indexOf(pattern), 1);
        }
      },
    };
  },
};

describe('MessageBox', () => {
  let MessageBox;

  beforeEach(() => {
    mock('redis', redis);
    MessageBox = require('./message-box');
  });

  it('sets a value', async () => {
    const mb = new MessageBox();
    await mb.set('myspecialkey', 'a value beyond belief');

    expect(redis.store.myspecialkey).to.be.equal('a value beyond belief');
  });

  it('retrieves an existing value', async () => {
    const mb = new MessageBox();
    await mb.set('anothergreatkey', 'a wonderful world');
    const value = await mb.get('anothergreatkey');

    expect(value).to.be.equal('a wonderful world');
  });

  it('gets notified of the next value in the box', (done) => {
    const mb = new MessageBox();
    mb.nextAtKey('redkey').then((value) => {
      expect(value).to.be.equal('bluevalue');
      done();
    }).catch(done);

    expect(redis.patterns).to.include('__keyspace@*__:redkey');
    expect(redis.listeners.pmessage.length).to.be.at.least(1);

    redis.storeAndTrigger('redkey', 'bluevalue');
  });

  it('returns the existing value if it exists', async () => {
    redis.store.redfish = 'bluefish';

    const mb = new MessageBox();

    const value = await mb.get('redfish');

    expect(value).to.be.equal('bluefish');
  });

  it('waits for the next value if it does not exist', (done) => {
    const mb = new MessageBox();

    mb.get('onefish').then((value) => {
      expect(value).to.be.equal('twofish');
      done();
    }).catch(done);

    setTimeout(() => {
      redis.storeAndTrigger('onefish', 'twofish');
    }, 20);
  });
});
