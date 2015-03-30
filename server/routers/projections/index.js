'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var battlegroundData = require('../data/').battlegroundData;
var forecastData = require('../data/').forecastData;
var parties = require('uk-political-parties');
var debug = require('debug')('projections-index');
var filters = require('../../util/filters');

function* home(next) {
  var battlegrounds = yield battlegroundData();
  var forecast = yield forecastData('seats');
  var updated = forecast.updated;

  debug(forecast);

  forecast = forecast.data.map(function(d){
    d.Party = parties.electionForecastToCode(d.Party);
    return d;
  });

  yield this.render('projections-index', { // jshint ignore:line
    page: {
      title: 'The 4 key UK general election battles',
      summary: 'Four different types of local contest will shape the most uncertain UK general election in memory',
      dateModified: updated instanceof Date ? 'Updated daily. Last updated ' + filters.ftdate(updated) : ''
    },
    groups: battlegrounds,
    overview: forecast
  });
  yield next;
}

function main() {
  return app()

        .use(siteNav())

        .use(viewLocals())

        .router()

        // forecast home page
        .get('home', '/', home);
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
