'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var app = require('./server')();
var http = require('http');
var server = http.createServer(app.callback());
var port = process.env.PORT || 3000;

server.listen(port);
