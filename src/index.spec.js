const assert = require('assert');
const sinon = require('sinon');
const mock = require('mock-require');

describe('Relayer', () => {
  let sandbox;
  let Relayer;

  before(() => { sandbox = sinon.sandbox.create(); })
  afterEach(() => { sandbox.restore(); })

  const fakeDb = sinon.spy();
  const fakeLogger = sinon.spy();
  const fakeEngine = sinon.spy();
  const fakeListen = sinon.spy();
  const fakeServer = sinon.spy();

  beforeEach(() => {
    // Setup utils
    mock('./utils', {
      db: fakeDb,
      logger: fakeLogger,
    });

    // Setup grpc server
    mock('./grpc-server', fakeServer);

    // Setup events
    mock('./events', {});

    // Setup fake payment engine
    mock('./payment-engines', {
      LndEngine: fakeEngine,
    });

    Relayer = require('./index');
  });


  describe('intialization', function() {
    it('returns an intance of a db', () => {
      Relayer.db;
      assert(fakeServer.called());
    })
  });
});
