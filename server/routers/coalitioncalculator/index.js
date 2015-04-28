'use strict';

var app = require('../../util/app');
var parties = require('uk-political-parties');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var forecastData = require('../data/').forecastData;

var data, expiry, fetching;

var page = {
  title: 'Coalition calculator',
  //summary: 'Adjust to number of parliamentary seats the major parties hold to see which alliances might be viable in the wake of the UK General Election.',
  dateModified: null
};


function* home(next) {

  if (!data || (!fetching && Date.now() > expiry)) {
    fetching = true;
    data = yield forecastData('seats');
    data.data = data.data.map(function(d){
      d.Party = parties.electionForecastToCode(d.Party);
      d.Lo = +d.Lo;
      d.Hi = +d.Hi;
      d.Swing = +d.Swing;
      d.Seats = +d.Seats;
      d.SeatsCurrent = d.Seats - d.Swing;
      return d;
    });
    expiry = Date.now() + (1000 * 60);
    fetching = false;
  }

  // store in browser cache for 5mins
  // allow CDN to store stale page for 8 hours
  // allow CDN to store stale if backend is erroring for 1 day
  this.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=28800, stale-if-error=86400'); // jshint ignore:line
  // allow CDN to store the response for 15mins
  this.set('Surrogate-Control', 'max-age=900'); // jshint ignore:line

  yield this.render('coalition-calculator', { // jshint ignore:line
    efdata: data,
    page: page
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
