'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var forecastData = require('../data/').forecastData;

function* home(next) {
  yield this.render('sankey-index', this.dataObject); // jshint ignore:line
  yield next;
}

function main() {
  return app()
    .use(siteNav())
    .use(viewLocals())
    .router()
      .get('home', '/', setItem, forecastData, home);
}

function* setItem(next){
  this.item = 'prediction'; // jshint ignore:line
  yield next;
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
