class GrpcAction {
  constructor(eventHandler, logger, engine) {
    this.engine = engine;
    this.eventHandler = eventHandler;
    this.logger = logger;
  }
}

module.exports = GrpcAction;
