const { EventEmitter } = require('events')
const LndEngine = require('lnd-engine')

const Relayer = require('./relayer')
const { logger, db } = require('./utils')
const { MessageBox } = require('./messaging')
const { MarketEventPublisher } = require('./events')

module.exports = new Relayer(EventEmitter, LndEngine, MessageBox, MarketEventPublisher, logger, db)
