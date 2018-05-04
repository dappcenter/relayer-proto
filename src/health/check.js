const { status } = require('grpc')

async function check (call, cb) {
  cb(null, {status: 'SERVING'})
}

module.exports = check