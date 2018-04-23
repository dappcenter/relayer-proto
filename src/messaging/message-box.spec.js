const sinon = require('sinon')

const MessageBox = require('./message-box')

describe('MessageBox', () => {
  let mb
  let redisClient

  beforeEach(() => {
    mb = new MessageBox()
    redisClient = sinon.spy()
    sinon.stub(mb, '_client').returns(redisClient)
    sinon.stub(redisClient, 'set')
  })

  // it('sets a value', async () => {
  //   await mb.set('myspecialkey', 'a value beyond belief')
  //   expect(redisClient).to.be.called.with('myspecialkey')
  // })

  // it('retrieves an existing value', async () => {
  //   const mb = new MessageBox()
  //   await mb.set('anothergreatkey', 'a wonderful world')
  //   const value = await mb.get('anothergreatkey')

  //   expect(value).to.be.equal('a wonderful world')
  // })

  // it('gets notified of the next value in the box', (done) => {
  //   const mb = new MessageBox()
  //   mb.nextAtKey('redkey').then((value) => {
  //     expect(value).to.be.equal('bluevalue')
  //     done()
  //   }).catch(done)

  //   expect(redis.patterns).to.include('__keyspace@*__:redkey')
  //   expect(redis.listeners.pmessage.length).to.be.at.least(1)

  //   redis.storeAndTrigger('redkey', 'bluevalue')
  // })

  // it('returns the existing value if it exists', async () => {
  //   redis.store.redfish = 'bluefish'

  //   const mb = new MessageBox()

  //   const value = await mb.get('redfish')

  //   expect(value).to.be.equal('bluefish')
  // })

  // it('waits for the next value if it does not exist', (done) => {
  //   const mb = new MessageBox()

  //   mb.get('onefish').then((value) => {
  //     expect(value).to.be.equal('twofish')
  //     done()
  //   }).catch(done)

  //   setTimeout(() => {
  //     redis.storeAndTrigger('onefish', 'twofish')
  //   }, 20)
  // })
})
