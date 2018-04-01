const grpcServer = require('./grpc-server');
const grpcServices = require('./grpc-services');

module.exports = {
  server: grpcServer,
  services: grpcServices,
};
