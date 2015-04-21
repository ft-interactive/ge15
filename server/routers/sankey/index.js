'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var forecastData = require('../data/').forecastData;

var forecast;
var expiry;
var fetching;

var page = {
  title: 'Win, lose or hold',
  summary: 'Predicted seat changes'
};

function* home(next) {


  if (!forecast || (!fetching && Date.now() > expiry)) {

    fetching = true;
    var start = Date.now();
    var res = yield forecastData('prediction');
    console.log('seat-moves op=data time=' + (Date.now() - start) + ' request_id=' + this.id);
    expiry = Date.now() + (1000 * 60);
    fetching = false;
    forecast = res;
  }

  // store in browser cache for 5mins
  // allow CDN to store stale page for 8 hours
  // allow CDN to store stale if backend is erroring for 1 day
  this.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=28800, stale-if-error=86400');
  // allow CDN to store the response for 15mins
  this.set('Surrogate-Control', 'max-age=900');

  var startRender = Date.now();

  yield this.render('sankey-index', { // jshint ignore:line
    forecast: forecast,
    page: page
  });

  console.log('seat-moves op=render time=' + (Date.now() - startRender) + ' request_id=' + this.id);

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
