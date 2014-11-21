var app = require('./app')();
var http = require('http');
var server = http.createServer(app.callback());
var port = process.env.PORT || 3000
server.listen(port);
console.log('%s started in %s mode and listening on port %s', app.name, app.env, port);
