var app = require('./server')();
var http = require('http');
var co = require('co');
var server = http.createServer(app.callback());
var db = require('./server/models');
var port = process.env.PORT || 3000

co(function *(){
  var connection = yield db.sequelize.authenticate();
  server.listen(port);
})();
