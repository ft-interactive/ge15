'use strict';

const _ = require('lodash');
const swig = require('swig');
const views = require('koa-views');

const filters = require('../util/filters');
const prod = process.env.NODE_ENV === 'production';

Object.keys(filters).forEach(function(name) {
  if (!_.isFunction(filters[name])) {
    return;
  }
  swig.setFilter(name, filters[name]);
});

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
  };
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

const middleware = views('../../templates', {
  cache: prod ? 'memory' : false,
  map: {
    html: 'swig'
  }
});

exports.middleware = middleware;
