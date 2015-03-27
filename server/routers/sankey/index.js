'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var forecastData = require('../data/').forecastData;

function* home(next) {
  var forecast = yield forecastData('prediction');
  yield this.render('sankey-index', { // jshint ignore:line
    forecast: forecast,
    page: {
      title: 'Seat Moves'
    }
  });
  yield next;
}

function main() {
  return app()
    .use(siteNav())
    .use(viewLocals())
    .router()
      .get('home', '/', home);
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
