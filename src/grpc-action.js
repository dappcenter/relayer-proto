class GrpcAction {
  constructor(eventHandler, queueManager, logger, engine) {
    this.engine = engine;
    this.eventHandler = eventHandler;
    this.queueManager = queueManager;
    this.logger = logger;
  }
}

module.exports = GrpcAction;
