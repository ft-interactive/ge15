'use strict';

const app = require('../../util/app');
const home_redirect = process.env.KILL_RESULTS === 'on' ? '/uk/2015/projections' : '/uk/2015/results';

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

function* loader_IO(next) {
  this.body = 'loaderio-5d48ad080f851bf1a83489b6dfd684b2';
  yield next;
}

function* home(next) {
  this.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=28800, stale-if-error=86400'); // jshint ignore:line
  this.set('Surrogate-Control', 'max-age=900'); // jshint ignore:line
  this.redirect(home_redirect); // jshint ignore:line
  this.status = 302;
  yield next;
}

function main() {
  return app().router()
          .get('/', home)
          .get('/india/general-election-2014', india)
          .get('/robots.txt', robots)
          .get('/loaderio-5d48ad080f851bf1a83489b6dfd684b2', loader_IO)
          .get('/__gtg', gtg);
}

module.exports = main;
