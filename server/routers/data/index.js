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
  seats:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/seats-latest.tsv',
  votes:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/votes-latest.tsv',
  probability:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/probability-latest.tsv',
  prediction:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/prediction-latest.tsv',
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

function mapArticleURLbyID(rows) {
  return _.reduce(rows,function(o, d){
    if (d.articleurl) {
      o[d.id] = d.articleurl;
    }
    return o;
  }, {});
}

var indexById = _.flow(tsv, _.partial(_.indexBy, _, 'id'));
var indexByONSid = _.flow(tsv, _.partial(_.indexBy, _, 'ons_id'));
var battlegroundSpreadsheets = [
  {uri: 'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/battlegrounds.tsv',
            transform: tsv, maxAge: maxAge},
  {uri: 'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/resultnow.tsv',
            transform: indexById, maxAge: maxAge},
  {uri: forecast.prediction + '?vkey',
            transform: indexById, maxAge: maxAge},
  {uri: 'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/coordinates.tsv',
            transform: indexById, maxAge: maxAge},
  {uri: 'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/details.tsv',
            transform: indexByONSid, maxAge: maxAge},
  {uri: 'http://bertha.ig.ft.com/view/publish/gss/0Ak6OnV5xs-BudHhZMTFlTTdITjFLS01IZnRvUlpIcWc/ConstituencyStories',
            transform: _.flow(JSON.parse, mapArticleURLbyID), maxAge: maxAge}
];

var battlegroundDataCache = {
  response: null,
  expiry: null
};

function battlegroundData() {

  if (battlegroundDataCache.expiry > Date.now()) {
    return Promise.resolve(battlegroundDataCache.response);
  }

  var promises = battlegroundSpreadsheets.map(request.bind(request));
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
    request({uri: forecast[item], transform: tsv, maxAge: 0}),
    request({uri: forecast.updated, json: true, maxAge: 0})
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
