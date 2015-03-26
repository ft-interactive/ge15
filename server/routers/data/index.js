'use strict';

var d3 = require('d3');
var _ = require('lodash');

var slopeDataParse = require('./slope-data.js');
var geoData = require('../../data/geo-data.js');
var coalitionDataParse = require('./coalition-data.js');
var request = require('../../util/request-cache');
var app = require('../../util/app');

var csv = _.ary(d3.csv.parse.bind(d3), 1);
var tsv = _.ary(d3.tsv.parse.bind(d3), 1);
var maxAge = 1000 * 60; // 1 minute

var forecast = {
  seats:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/seats-latest',
  votes:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/votes-latest',
  probability:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/probability-latest',
  prediction:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/prediction-latest',
  updated:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/updated.json'
};

var coalitionProbabilities = 'http://interactivegraphics.ft-static.com/data/coalition-probabilities/example.csv';

function main() {
  return app()
    .router()
      .get('seat-forecast','/forecast/:item.json', function* (next) {
        this.assert(forecast.hasOwnProperty(this.params.item), 404, 'Not Found');
        this.body = yield forecastData(this.params.item);
        yield next;
      })
      .get('battlegrounds','/battlegrounds.json', function* (next) {
        this.body = yield battlegroundData();
        yield next;
      })
      .get('simplemap','/simplemap.json', function* (next) {
        this.body = geoData.simple;
        yield next;
      })
      .get('coalition-forecast','/coalition-forecast.json', function* (next) {
        this.body = yield coalitionForecastData();
        yield next;
      });
}

function coalitionForecastData() {
  return request({
    uri: coalitionProbabilities,
    transform: _.flow(csv, coalitionDataParse),
    maxAge: maxAge
  });
}

var indexById = _.flow(tsv, _.partial(_.indexBy, _, 'id'));
var indexByONSid = _.flow(tsv, _.partial(_.indexBy, _, 'ons_id'));
var battlegroundSpreadsheets = [
  ['http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/battlegrounds.tsv', tsv],
  ['http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/resultnow.tsv', indexById],
  [forecast.prediction, indexById],
  ['http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/coordinates.tsv', indexById],
  ['http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/details.tsv', indexByONSid]
];

function endpointToRequest(endpoint) {
  return request({uri: endpoint[0], transform: endpoint[1], maxAge: maxAge});
}

var battlegroundDataCache = {
  response: null,
  expiry: null
};

function battlegroundData() {

  if (battlegroundDataCache.expiry > Date.now()) {
    return Promise.resolve(battlegroundDataCache.response);
  }

  var promises = battlegroundSpreadsheets.map(endpointToRequest);
  return Promise.all(promises)
                .then(_.spread(slopeDataParse))
                .then(function(response) {
                  battlegroundDataCache.response = response;
                  battlegroundDataCache.expiry = Date.now() + 5000;
                  return response;
                });
}

function forecastData(item) {

  var source = {
    name:'electionforecast.co.uk',
    link:'http://www.electionforecast.co.uk'
  };

  return Promise.all([
    request({uri: forecast[item], transform: tsv, maxAge: maxAge}),
    request({uri: forecast.updated, json: true, maxAge: maxAge})
  ])
  .then(_.spread(function(data, updated) {
    return {
      data: data,
      updated: updated.updated,
      source: source
    };
  }));
}

module.exports ={
  routes:main,
  forecastData:forecastData,
  battlegroundData:battlegroundData,
  coalitionForecastData:coalitionForecastData
};

if (!module.parent) main().listen(process.env.PORT || 5000);
