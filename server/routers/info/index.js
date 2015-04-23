'use strict';

var app = require('../../util/app');

function* gtg(next) {
  this.set('Cache-Control', 'no-cache');
  this.body = 'OK';
  yield next;
}

function* robots(next) {
  this.body = 'User-agent: *\nAllow: /';
  yield next;
}

function* india(next) {
  this.redirect('http://india-2014.herokuapp.com/india/general-election-2014/');
  this.status = 301;
  yield next;
}

function* home(next) {
  this.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=28800, stale-if-error=86400'); // jshint ignore:line
  this.set('Surrogate-Control', 'max-age=900'); // jshint ignore:line
  this.redirect('/uk/2015/projections'); // jshint ignore:line
  this.status = 302;
  yield next;
}

function main() {
  return app().router()
          .get('/', home)
          .get('/india/general-election-2014', india)
          .get('/robots.txt', robots)
          .get('/__gtg', gtg);
}

module.exports = main;
