const { expect, mock } = require('test/test-helper')

describe('messenging index', () => {
  let messageBox

  beforeEach(() => {
    mock('./message-box', {})

    messageBox = require('./index')
  })

  afterEach(() => {
    mock.stopAll()
  })

  describe('implementations', () => {
    it('createFill', () => expect(messageBox.MessageBox).to.be.implemented())
  })
})
