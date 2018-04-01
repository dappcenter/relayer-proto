/**
 * Class that provides implementations for a given service
 */

const { maker, taker } = require('./streams');
const { subscribeOrders, getOrders } = require('./actions');

const SERVICES = {
  RELAYER: 'RelayerClient',
};

class RelayerImplementations {
  constructor(name, logger, eventHandler) {
    this.name = name;
    this.logger = logger;
    this.eventHandler = eventHandler;
    this.implementations = this.register(this.name);
  }

  export() {
    this.logger.info('Exporting implementations', { service: this.name });
    return this.implementations;
  }

  /**
   * Given a service name, we will register the name with the appropriate
   * implementations and return them.
   *
   * @param {String} name
   * @returns {Object} implementations
   */
  register(name) {
    switch (name) {
      case SERVICES.RELAYER:
        return {
          maker: maker.bind(this),
          taker: taker.bind(this),
          subscribeOrders: subscribeOrders.bind(this),
          getOrders: getOrders.bind(this),
        };
      default:
        this.logger.info('No match has been found for implementation registration', { service: name });
        return {};
    }
  }
}

module.exports = RelayerImplementations;
