const { mock, chai, sinon } = require('test/test-helper.spec')

const { expect } = chai

class GrpcServer {
  listen () {}
}

describe('Relayer', () => {
  let Relayer

  const fakeDb = sinon.spy()
  const fakeLogger = sinon.spy()
  const fakeEngine = sinon.spy()
  const fakeServer = sinon.spy(() => sinon.createStubInstance(GrpcServer))

  beforeEach(() => {
    // Setup utils
    mock('./utils', {
      db: fakeDb,
      logger: { error: fakeLogger }
    })
    mock('./events', {})
    mock('./grpc-server', fakeServer)
    mock('lnd-engine', fakeEngine)

    Relayer = require('./index')
  })

  describe('intialization', () => {
    it('returns an intance of a db', () => {
      expect(Relayer.db).to.eq(fakeDb)
    })
  })
})
