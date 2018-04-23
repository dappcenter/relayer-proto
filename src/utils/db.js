const mongoose = require('mongoose')

// TODO: throw this in a try catch and provide decent errors for development
const MONGODB_URL = process.env.MONGODB_CONNECTION_URL

if (!MONGODB_URL) {
  throw new Error('Environment variable MONGODB_CONNECTION_URL not set in `db.js')
}

mongoose.set('debug', () => (process.env.NODE_ENV === 'development'))

module.exports = mongoose.connect(MONGODB_URL)
