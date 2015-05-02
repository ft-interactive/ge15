'use strict';

module.exports = main;

const debug = require('debug')('ge15:app');
const koa = require('koa');
const routers = require('./routers');
const pkg = require('../package.json');
const trace = require('koa-trace');
const favicon = require('koa-favicon');
const requestId = require('koa-request-id');
const responseTime = require('koa-response-time');
const conditional = require('koa-conditional-get');
const etag = require('koa-etag');
const serve = require('koa-static');
const onerror = require('koa-onerror');
const htmlMinifier = require('koa-html-minifier');
const sentry = require('koa-sentry');
const printRequestId = require('./middleware/print-request-id');
const ms = require('ms');
const path = require('path');
const raven = require('../raven');
const cors = require('koa-cors');

function main() {
  var app = koa();

  app.name = pkg.name;
  app.proxy = true;
  app.poweredBy = false;

  onerror(app, {template: './templates/error.html'});
  sentry(app, raven);
  trace(app);

  app.isProd = app.context.isProd = process.env.NODE_ENV === 'production';

  debug('NODE_ENV=' + process.env.NODE_ENV);

  app.context.raven = raven;

  if (!app.isProd || /koa-trace/.test(process.env.DEBUG)) app.debug();

  app.use(function*(next) {
    this.set('Timing-Allow-Origin', '*');
    yield next;
  });


  app.use(cors({
    origin: true // do something more specific here
  }));

  app.use(favicon(path.resolve(__dirname, '../public/images/favicon.ico')));
  app.use(conditional());
  app.use(etag());
  app.use(serve(path.resolve(__dirname, '../public'), {
    maxage: app.isProd ? ms('30 days') : 0,
    gzip: true
  }));
  app.use(requestId('X-Request-ID'));
  app.use(responseTime());
  app.use(printRequestId());
  app.use(function*(next){
    this.locals = this.locals || {};
    this.locals.context = this;
    yield next;
  });

  app.use(htmlMinifier({
    collapseWhitespace: true,
    minifyJS: true,
    minifyCSS: true
  }));

  if (!app.isProd) {
    debug('Using livereload');
    app.use(require('koa-livereload')());
  }

  routers(app);
  return app;
}
