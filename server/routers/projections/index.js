'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var battlegroundData = require('../data/').battlegroundData;
var forecastData = require('../data/').forecastData;
var coalitionForecastData = require('../data/').coalitionForecastData;
var parties = require('uk-political-parties');
var debug = require('debug')('projections-index');
var _ = require('lodash');
var data;
var expiry;
var fetching;
var page = {
  title: 'The key UK general election battles',
  summary: 'Four contests will decide the most uncertain UK election for decades',
  dateModified: null
};


function* home(next) {

  if (!data || (!fetching && Date.now() > expiry)) {
    fetching = true;

    var start = Date.now();

    var res = _.zipObject(['battlegrounds', 'forecast','coalitions'], yield Promise.all([
        battlegroundData(),
        forecastData('seats'),
        coalitionForecastData()
    ]));

    console.log('projections-index op=data time=' + (Date.now() - start) + ' request_id=' + this.id);

    debug(res.forecast);

    var overview = _.clone(res.forecast.data, true).map(function(d) {
      d.Party = parties.electionForecastToCode(d.Party);
      d.Seats = Number(d.Seats);
      return d;
    });

    var largestParty = overview.reduce(function(largest, d){
      if (d.Seats > largest) {
        largest = d.Seats;
      }
      return largest;
    },0);

    var coalitions = coalitionSum(res.coalitions.coalitions, overview, largestParty);

    expiry = Date.now() + (1000 * 60);
    fetching = false;
    page.dateModified = res.forecast.updated || page.dateModified;
    data = { // jshint ignore:line
      page: page,
      groups: res.battlegrounds,
      overview: overview,
      coalitions: coalitions
    };
  }

  // store in browser cache for 5mins
  // allow CDN to store stale page for 8 hours
  // allow CDN to store stale if backend is erroring for 1 day
  this.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=28800, stale-if-error=86400'); // jshint ignore:line
  // allow CDN to store the response for 15mins
  this.set('Surrogate-Control', 'max-age=900'); // jshint ignore:line
  var startRender = Date.now();
  yield this.render('projections-index', data); // jshint ignore:line
  console.log('projections-index op=render time=' + (Date.now() - startRender) + ' request_id=' + this.id);
  yield next;
}

function* widget(next) {
  var overview;
  var updated;

  if (data && data.overview) {
    updated = data.page.dateModified;
    overview = data.overview;
  } else {

    var start = Date.now();
    var res = yield forecastData('seats');
    console.log('projections-widget op=data time=' + (Date.now() - start) + ' request_id=' + this.id);
    updated = res.updated;
    overview = _.clone(res.data, true).map(function(d) {
      d.Party = parties.electionForecastToCode(d.Party);
      d.Seats = Number(d.Seats);
      return d;
    });

  }

  this.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=28800, stale-if-error=86400'); // jshint ignore:line
  this.set('Surrogate-Control', 'max-age=900'); // jshint ignore:line
  var startRender = Date.now();
  yield this.render('projections-widget', {parties: overview, updated: updated}); // jshint ignore:line
  console.log('projections-widget op=render time=' + (Date.now() - startRender) + ' request_id=' + this.id);
  yield next;
}

function main() {
  return app()

        .use(siteNav())

        .use(viewLocals())

        .router()

        // forecast home page
        .get('home', '/', home)

        .get('ftcom', '/seats-projection-widget', widget);
}

function coalitionSum(coalitions, results, threshold) {

  if (!results || !results.length || !coalitions || !coalitions.length) {
    console.error('Unable to calculate coalitions');
    console.log('Results');
    console.dir(results);
    console.log('Coalitions');
    console.dir(coalitions);
    return null;
  }

  var resultLookup = _.indexBy(results, 'Party');

  function partyTotal(d) {
    var result = this[d]; // jshint ignore:line
    if (!result) {
      console.error('Error looking up result', d);
      return;
    }
    return {
      party: d,
      seats: Number(result.Seats)
    };
  }

  function sumTotal(total, party) {
    total += party.seats;
    return total;
  }

  function gtThreshold(d) {
    return d.totalSeats > threshold;
  }

  function removeSinglePartyGovt(d){
    return d.parties.length > 1;
  }

  function createCoalition(d) {
    var coalition = {probablity: Number(d.probability)};
    coalition.parties = _.sortByOrder(d.parties.map(partyTotal, resultLookup).filter(Boolean), ['seats', 'party'], [true, true]);
    coalition.totalSeats = coalition.parties.reduce(sumTotal, 0);
    return coalition;
  }

  coalitions = coalitions.map(createCoalition)
                            .filter(removeSinglePartyGovt)
                            .filter(gtThreshold);

  return _.sortByOrder(coalitions, ['totalSeats'], [false]);
}

module.exports = main;
