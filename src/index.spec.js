const assert = require('assert');
const sinon = require('sinon');

const Relayer = require('./index');

describe('Relayer', () => {
  const fakeServer = sinon.spy();

  describe('intialization', function() {
    it('returns a db', () => {
      asset(fakeServer.called());
    })
    it('should return -1 when the value is not present', function() {
      assert.equal([1,2,3].indexOf(4), -1);
    });
  });

});
