class GrpcAction {
  constructor(eventHandler, logger, db) {
    this.db = db;
    this.eventHandler = eventHandler;
    this.logger = logger;
  }
}

module.exports = GrpcAction;
