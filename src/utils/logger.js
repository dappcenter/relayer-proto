/**
 * Logging utility for Relayer
 *
 * Writes all logs with level `info` (or as specific by environment) and below
 * to `combined.log`
 * Additionally, writes all log errors (and below) to `error.log`
 *
 * If we're not in production then log to the `console` with the format
 * `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
 *
 * @author kinesis
 */

const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.simple(),
    ),
  }));
}

module.exports = logger;