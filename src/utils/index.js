const logger = require('./logger')
const db = require('./db')
const promiseOnce = require('./promise-once')
const loadProto = require('./load-proto')

module.exports = {
  logger,
  db,
  promiseOnce,
  loadProto
}
