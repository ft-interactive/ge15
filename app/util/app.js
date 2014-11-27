var koa = require('koa');
var router = require('koa-router');
var views = require('koa-views');
var _ = require('lodash');

var defaultOptions = {
  views: true,
  router: false,
  isProd: process.env.NODE_ENV === 'production'
}

module.exports = function(options) {

  options = _.merge(_.cloneDeep(defaultOptions), options);

  var app = koa();

  app.isProd = options.isProd;

  if (options.views) {
    app.use(views('../views', {
      cache: app.isProd ? 'memory' : false,
      map: {
        html: 'swig'
      }
    }));
  }

  app.router = function() {
    app.use(router(app));
    return app;
  }

  // set options.router = true
  // to autostart the router
  if (options.router) {
    app.router();
  }

  return app;
}
