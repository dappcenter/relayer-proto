class GrpcAction {
  constructor (eventHandler, messenger, logger, engine) {
    this.engine = engine
    this.eventHandler = eventHandler
    this.messenger = messenger
    this.logger = logger
  }
}

module.exports = GrpcAction
