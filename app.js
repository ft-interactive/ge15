'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const debug = require('debug')('ge15:main');

debug('Load database');

const db = require('./db').start();

debug('Create app instance');

const app = require('./server')();
const http = require('http');
const port = process.env.PORT || 3000;

debug('Create server');
const server = http.createServer(app.callback());

debug('Data sources: start update all');

db.data_sources.update.all(function() {
  debug('Data sources: update all complete');
  debug('Start server');
  server.listen(port, function(){
    debug('Listening on ' + port);
  });
});
