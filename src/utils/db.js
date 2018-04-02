const mongojs = require('mongojs');

const MONGODB_URL = process.env.MONGODB_CONNECTION_URL || 'mongodb://localhost:27017/relayer';
const COLLECTION_NAME = 'marketevents';

const db = mongojs(MONGODB_URL, [COLLECTION_NAME]);

module.exports = db;
