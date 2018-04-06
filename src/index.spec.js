const assert = require('assert');
const sinon = require('sinon');
const mock = require('mock-require');


const relayer = require('./index');

describe('Relayer', () => {
  let Relayer;

  const fakeDb = sinon.spy();
  const fakeLogger = sinon.spy();

  beforeEach(() => {
    mock('./utils', {
      db: fakeDb,
      logger: fakeLogger,
    });
    Relayer = relayer;
  });


  describe('intialization', function() {
    it('returns an intance of a db', () => {
      Relayer.db;
      assert(fakeServer.called());
    })
  });
});
