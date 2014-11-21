module.exports = main;

var koa = require('koa');
var views = require('koa-views');
var routers = require('./routers');
var pkg = require('../package.json');
var swig = require('swig');
var _ = require('lodash');
var trace = require('koa-trace');
var favicon = require('koa-favicon');
var requestId = require('koa-request-id');
var responseTime = require('koa-response-time');
var conditional = require('koa-conditional-get');
var etag = require('koa-etag');
var serve = require('koa-static');
var htmlMinifier = require('koa-html-minifier');
var printRequestId = require('./middleware/print-request-id');
var ms = require('ms');
var filters = require('./filters');

for (var fn in filters) {
  if (_.isFunction(filters[fn])) {
    swig.setFilter(fn, filters[fn]);
  }
}

function main() {
  var app = koa();

  trace(app);

  app.name = pkg.name;
  app.proxy = true;
  app.poweredBy = false;
  app.isProd = process.env.NODE_ENV === 'production';

  if (!app.isProd) app.debug();

  app.use(favicon('./public/favicon.ico'));
  app.use(conditional());
  app.use(etag());
  app.use(serve(__dirname + '/public', {
    maxage: app.isProd ? ms('30 days') : 0
  }));
  app.use(requestId());
  app.use(responseTime());
  app.use(printRequestId());
  app.use(views('views', {
    cache: app.isProd ? 'memory' : false,
    map: {
      html: 'swig'
    }
  }));

  routers(app);

  if (app.isProd) {
    app.use(htmlMinifier({
      collapseWhitespace: true
    }));
  }

  return app;
}

if (!module.parent) {
  main().listen(process.env.PORT || 3000);
}
