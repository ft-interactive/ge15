'use strict';

var d3 = require('d3');
var _ = require('lodash');

var slopeDataParse = require('./slope-data.js');
var geoData = require('../../data/geo-data.js');
var coalitionDataParse = require('./coalition-data.js');
var request = require('request-promise');
var app = require('../../util/app');

var csv = _.ary(d3.csv.parse.bind(d3), 1);
var tsv = _.ary(d3.tsv.parse.bind(d3), 1);
var requestTSV = function(uri) {
  return request({uri: uri, transform: tsv});
};

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
        this.body = coalitionForecastData();
        yield next;
      });
}

function coalitionForecastData() {
  return request({
    uri: coalitionProbabilities,
    transform: csv
  })
  .then(coalitionDataParse);
}


var battlegroundSpreadsheets = [
  'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/battlegrounds.tsv',
  'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/resultnow.tsv',
  forecast.prediction,
  'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/coordinates.tsv',
  'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/details.tsv'
];

function battlegroundData() {
  var promises = battlegroundSpreadsheets.map(requestTSV);
  return Promise.all(promises)
                .then(_.spread(slopeDataParse));
}

function forecastData(item) {

  var source = {
    name:'electionforecast.co.uk',
    link:'http://www.electionforecast.co.uk'
  };

  return Promise.all([
    request({uri: forecast[item], transform: tsv}),
    request({uri: forecast.updated, json: true})
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
