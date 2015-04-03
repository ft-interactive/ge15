'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var battlegroundData = require('../data/').battlegroundData;
var forecastData = require('../data/').forecastData;
var parties = require('uk-political-parties');
var debug = require('debug')('projections-index');
var _ = require('lodash');
var data;
var expiry;
var fetching;

function* home(next) {


  if (!data || (!fetching && Date.now() > expiry)) {

    fetching = true;

    var res = _.zipObject(['battlegrounds', 'forecast'], yield Promise.all([
        battlegroundData(),
        forecastData('seats')
    ]));

    debug(res.forecast);

    res.forecast.data = res.forecast.data.map(function(d) {
      d.Party = parties.electionForecastToCode(d.Party);
      return d;
    });

    expiry = Date.now() + (1000 * 60);
    fetching = false;
    data = res;
  }

  // store in browser cache for 5mins
  // allow CDN to store stale page for 8 hours
  // allow CDN to store stale if backend is erroring for 1 day
  this.set('Cache-Control', 'max-age=300, s-maxage=300, stale-while-revalidate=28800, stale-if-error=86400');
  // allow CDN to store the response for 15mins
  this.set('Surrogate-Control', 'max-age=900')

  yield this.render('projections-index', { // jshint ignore:line
    page: {
      title: 'The key UK general election battles',
      summary: 'Four contests will decide the most uncertain UK election for decades',
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
