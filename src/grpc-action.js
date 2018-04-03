class GrpcAction {
  constructor(eventHandler, logger, db, engine) {
    this.db = db;
    this.engine = engine;
    this.eventHandler = eventHandler;
    this.logger = logger;
  }
}

module.exports = GrpcAction;
