var koa = require('koa');
var router = require('koa-router');
var views = require('koa-views');
var _ = require('lodash');
var swig = require('swig');
var filters = require('./filters');
var prod = process.env.NODE_ENV === 'production';

var defaultOptions = {
  views: true,
  router: false,
  isProd: prod
}

for (var fn in filters) {
  if (_.isFunction(filters[fn])) {
    swig.setFilter(fn, filters[fn]);
  }
}

var baseurl = {
  static: '', // TODO: use cdn host if production
  site: '',
  ft: '//www.ft.com'
};

var assets;
var getAsset;

if (prod) {
  assets = require('../../public/rev-manifest.json');
  console.log('Load asset paths', assets);
  getAsset = function(name) {
    if (!assets[name]) return '';
    return baseurl.static + '/' + assets[name];
  };
} else {
  getAsset = function(name) {
    return baseurl.static + '/' + name;
  }
}

function getNow() {
  return Date.now();
}

swig.setDefaults({
  cache: prod ? 'memory' : false,
  locals: {
    baseurl: baseurl,
    asset: getAsset,
    now: getNow
  }
});

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
