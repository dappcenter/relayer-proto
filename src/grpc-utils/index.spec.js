const { expect, mock } = require('test/test-helper')

describe('grpc-utils index', () => {
  let utils

  beforeEach(() => {
    mock('./load-proto', {})
    mock('./add-implementations', {})

    utils = require('./index')
  })

  afterEach(() => {
    mock.stopAll()
  })

  describe('implementations', () => {
    it('loadProto', () => expect(utils.loadProto).to.be.implemented())
    it('addImplementations', () => expect(utils.addImplementations).to.be.implemented())
  })
})
