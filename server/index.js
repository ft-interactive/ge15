'use strict';

module.exports = main;

var koa = require('koa');
var routers = require('./routers');
var pkg = require('../package.json');

var trace = require('koa-trace');
var favicon = require('koa-favicon');
var requestId = require('koa-request-id');
var responseTime = require('koa-response-time');
var conditional = require('koa-conditional-get');
var etag = require('koa-etag');
var serve = require('koa-static');
var htmlMinifier = require('koa-html-minifier');
var livereload = require('koa-livereload');
var printRequestId = require('./middleware/print-request-id');
var ms = require('ms');
var path = require('path');

function main() {
  var app = koa();

  trace(app);

  app.name = pkg.name;
  app.proxy = true;
  app.poweredBy = false;
  app.isProd = process.env.NODE_ENV === 'production';

  if (!app.isProd) app.debug();

  app.use(favicon(path.resolve(__dirname, '../public/favicon.ico')));
  app.use(conditional());
  app.use(etag());
  app.use(serve(path.resolve(__dirname, '../public'), {
    maxage: app.isProd ? ms('30 days') : 0,
    gzip: true
  }));
  app.use(requestId());
  app.use(responseTime());
  app.use(printRequestId());
  app.use(function*(next){
    this.locals = this.locals || {};
    this.locals.context = this;
    yield next;
  });

  if (app.isProd) {
    app.use(htmlMinifier({
      collapseWhitespace: true,
      minifyJS: true,
      minifyCSS: true
    }));
  } else {
    app.use(livereload());
  }

  routers(app);
  return app;
}

if (!module.parent) {
  main().listen(process.env.PORT || 3000);
}
