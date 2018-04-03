const mongoose = require('mongoose');

// TODO: throw this in a try catch and provide decent errors for development
const MONGODB_URL = process.env.MONGODB_CONNECTION_URL;

mongoose.set('debug', () => (process.env.NODE_ENV === 'development'));

module.exports = mongoose.createConnection(MONGODB_URL);
