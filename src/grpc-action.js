class GrpcAction {
  constructor(eventHandler, marketEventPublisher, logger, engine) {
    this.engine = engine;
    this.eventHandler = eventHandler;
    this.marketEventPublisher = marketEventPublisher;
    this.logger = logger;
  }
}

module.exports = GrpcAction;
