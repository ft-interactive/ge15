'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var forecastData = require('../data/').forecastData;

function* home(next) {

  yield this.render('sankey-index', {
    data:JSON.stringify(this.forecastData.data),
    updated:JSON.stringify(this.forecastData.updated),
    source:JSON.stringify(this.forecastData.source)
  });
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
  this.item = 'prediction';
  yield next;
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
