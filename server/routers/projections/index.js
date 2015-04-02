'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var battlegroundData = require('../data/').battlegroundData;
var forecastData = require('../data/').forecastData;
var parties = require('uk-political-parties');
var debug = require('debug')('projections-index');
var filters = require('../../util/filters');
var _ = require('lodash');

function* home(next) {

  var data = _.zipObject(['battlegrounds', 'forecast'], yield Promise.all([
      battlegroundData(),
      forecastData('seats')
  ]));

  debug(data.forecast);

  data.forecast.data = data.forecast.data.map(function(d){
    d.Party = parties.electionForecastToCode(d.Party);
    return d;
  });

  yield this.render('projections-index', { // jshint ignore:line
    page: {
      title: 'The 4 key UK general election battles',
      summary: 'Four different types of local contest will shape the most uncertain UK general election in memory',
      dateModified: data.forecast.updated
    },
    groups: data.battlegrounds,
    overview: data.forecast.data
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
