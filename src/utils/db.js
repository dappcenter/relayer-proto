const mongoose = require('mongoose')

const MONGODB_URL = process.env.MONGODB_CONNECTION_URL
const DEV_ENV = process.env.NODE_ENV === 'development'

function connectDb () {
  if (!MONGODB_URL) {
    throw new Error('Environment variable MONGODB_CONNECTION_URL not set in `db.js')
  }

  mongoose.set('debug', () => DEV_ENV)

  return mongoose.connect(MONGODB_URL)
}

module.exports = connectDb
