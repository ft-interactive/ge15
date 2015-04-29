'use strict';

var app = require('../../util/app');
var parties = require('uk-political-parties');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var forecastData = require('../data/').forecastData;
var _ = require('lodash');
var data, expiry, fetching;

var page = {
  title: 'Coalition calculator',
  meta: {
    image: 'http://im.ft-static.com/content/images/18f47148-eda6-11e4-a894-00144feab7de.img'
  },
  dateModified: null
};


function* home(next) {

  if (!data || (!fetching && Date.now() > expiry)) {
    fetching = true;
    var res = yield forecastData('seats');
    data = _.clone(res, true);
    data.data.map(function(d) {
      return {
        Party: parties.electionForecastToCode(d.Party),
        Lo: Number(d.Lo),
        Hi: Number(d.Hi),
        Swing: Number(d.Swing),
        Seats: Number(d.Seats),
        SeatsCurrent: Number(d.Seats) - Number(d.Swing)
      };
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
