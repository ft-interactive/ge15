'use strict';

const koa = require('koa');
const router = require('koa-router');
const _ = require('lodash');
const templates = require('../middleware/swig');
const prod = process.env.NODE_ENV === 'production';
const defaultOptions = {
  views: true,
  router: false
};

module.exports = function(options) {

  options = _.merge(_.cloneDeep(defaultOptions), options);

  const app = koa();

  app.isProd = prod;

  if (options.views) {
    app.use(templates.middleware);
  }

  app.router = function() {
    app.use(router(app));
    return app;
  };

  // set options.router = true
  // to autostart the router
  if (options.router) {
    app.router();
  }

  return app;
};
