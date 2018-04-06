const GrpcAction = require('./grpc-action');

class GrpcMarketAction extends GrpcAction {
  constructor(marketEventPublisher, ...args) {
  	super(...args);
    this.marketEventPublisher = marketEventPublisher;
  }
}

module.exports = GrpcMarketAction;
