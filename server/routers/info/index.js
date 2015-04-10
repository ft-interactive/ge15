'use strict';

var app = require('../../util/app');

function* gtg(next) {
  this.set('Cache-Control', 'no-cache');
  this.body = 'OK';
  yield next;
}


function* india(next) {
  this.redirect('http://india-2014.herokuapp.com/india/general-election-2014/');
  this.status = 301;
  yield next;
}

function* home(next) {
  this.redirect('/uk/2015/projections/');
  this.status = 302;
  yield next;
}

function main() {
  return app().router()
          .get('/', home)
          .get(/^\/india\/*/, india)
          .get('/:country', home)
          .get('/:country/:year/', home)
          .get('/__gtg', gtg);
}

module.exports = main;
