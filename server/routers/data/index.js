'use strict';

const d3 = require('d3');
const _ = require('lodash');

const slopeDataParse = require('./slope-data.js');
const coalitionDataParse = require('./coalition-data.js');
const request = require('../../util/request-cache');
const app = require('../../util/app');

const csv = _.ary(d3.csv.parse.bind(d3), 1);
const tsv = _.ary(d3.tsv.parse.bind(d3), 1);
const shortMaxAge = 1000 * 60; // 1 minute
const fiveMins = 1000 * 60 * 5;
const longMaxAge = 1000 * 60 * 60 * 8; // 8 hours

var forecast = {
    seats:'http://interactive.ftdata.co.uk/data/electionforecast-co-uk/tsv/seats-latest.tsv',
  votes:'http://interactive.ftdata.co.uk/data/electionforecast-co-uk/tsv/votes-latest.tsv',
  probability:'http://interactive.ftdata.co.uk/data/electionforecast-co-uk/tsv/probability-latest.tsv',
  prediction:'http://interactive.ftdata.co.uk/data/electionforecast-co-uk/tsv/prediction-latest.tsv',
  updated:'http://interactive.ftdata.co.uk/data/electionforecast-co-uk/updated.json'
};

var coalitionProbabilities = 'http://interactive.ftdata.co.uk/data/coalition-probabilities/example.csv';

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
      .get('coalition-forecast','/coalition-forecast.json', function* (next) {
        this.body = yield coalitionForecastData();
        yield next;
      });
}

function coalitionForecastData() {
  return request({
    uri: coalitionProbabilities,
    transform: _.flow(csv, coalitionDataParse),
    maxAge: shortMaxAge
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
  {uri: 'http://bertha.ig.ft.com/view/publish/gss/0Ak6OnV5xs-BudHhZMTFlTTdITjFLS01IZnRvUlpIcWc/ConstituencyGroups?exp=60',
            transform: JSON.parse, maxAge: fiveMins},
  {uri: 'http://interactive.ftdata.co.uk/data/ge15-battlegrounds/resultnow.tsv',
            transform: indexById, maxAge: longMaxAge},
  {uri: forecast.prediction + '?vkey',
            transform: indexById, maxAge: fiveMins},
  {uri: 'http://interactive.ftdata.co.uk/data/ge15-battlegrounds/coordinates.tsv',
            transform: indexById, maxAge: longMaxAge},
  {uri: 'http://interactive.ftdata.co.uk/data/ge15-battlegrounds/details.tsv',
            transform: indexByONSid, maxAge: longMaxAge},
  {uri: 'http://bertha.ig.ft.com/view/publish/gss/0Ak6OnV5xs-BudHhZMTFlTTdITjFLS01IZnRvUlpIcWc/ConstituencyStories?exp=60',
            transform: _.flow(JSON.parse, mapArticleURLbyID), maxAge: fiveMins}
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
    request({uri: forecast[item], transform: tsv, maxAge: shortMaxAge}),
    request({uri: forecast.updated, json: true, maxAge: shortMaxAge})
  ])
  .then(_.spread(function(data, updated) {
    return {
      data: data,
      updated: new Date(updated.updated),
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
