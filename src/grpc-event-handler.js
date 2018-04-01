const { EventEmitter } = require('events');

const { actions } = require('./actions');

/**
 * Event Handler for the Relayer
 *
 * @author kinesis
 */
class GrpcEventHandler extends EventEmitter {
  constructor(logger) {
    super();

    this.logger = logger;

    try {
      this.registerEvents();
    } catch (e) {
      this.logger.error('Could not register events', { error: e });
      throw (e);
    }
  }

  /**
   * Registers all events for a Relayer
   *
   * TODO: Load events by type of request?
   * @returns {void}
   */
  registerEvents() {
    return actions.forEach((action) => {
      this.logger.info('Registering event', { name: action.name });
      this.addEvent(action.name, action.fn);
    });
  }

  addEvent(name, action) {
    this.on(name, this._wrap(action));
  }

  /**
   * Creates a standard format of messages for a given action.
   *
   * Each action will receive the following parameters:
   * - context (this)
   * - orderId
   * - request
   *
   * TODO: change _wrap to be a type of object or something
   * @param {Function} action
   * @returns {Promise}
   */
  _wrap(fn) {
    return (orderId, request, respond) => {
      fn
        .call(this, orderId, request)
        .then((response) => {
          respond(null, ...response);
        }, (err) => {
          this.logger.error('wire error', err);
          respond(err);
        });
    };
  }
}

module.exports = GrpcEventHandler;
