const mongoose = require('mongoose');

const MONGODB_URL = process.env.MONGODB_CONNECTION_URL || 'mongodb://localhost:27017/relayer';

mongoose.set('debug', () => (process.env.NODE_ENV === 'development'));

module.exports = mongoose.createConnection(MONGODB_URL);
