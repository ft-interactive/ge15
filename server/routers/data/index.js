'use strict';
var request = require('koa-request');
var d3 = require('d3');
var slopeDataParse = require('./slope-data.js');
var geoData = require('../../data/geo-data.js');
var coalitionDataParse = require('./coalition-data.js');

var app = require('../../util/app');

var forecast = {
  seats:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/seats-latest',
  votes:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/votes-latest',
  probability:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/probability-latest',
  prediction:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/tsv/prediction-latest',
  updated:'http://interactivegraphics.ft-static.com/data/electionforecast-co-uk/updated.json'
};

var battlegrounds = 'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/battlegrounds.tsv';
var resultNow = 'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/resultnow.tsv';
var coordinates = 'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/coordinates.tsv';
var details = 'http://interactivegraphics.ft-static.com/data/ge15-battlegrounds/details.tsv';

var coalitionProbabilities = 'http://interactivegraphics.ft-static.com/data/coalition-probabilities/example.csv';

function main() {
  return app().router()
    .param('item', function* (item, next ){
      if( !forecast.hasOwnProperty(item) ){
        this.status = 404;
        return;
      }
      this.item = item;
      yield next;
    })
    .get('seat-forecast','/forecast/:item/json', forecastData, dataResponse)
    .get('battlegrounds','/battlegrounds/json', battlegroundData, dataResponse)
    .get('simplemap','/simplemap/json', simpleMapData, dataResponse)
    .get('coalition-forecast','/coalition-forecast/json', coalitionForecastData, dataResponse);
}

function* simpleMapData(next){
  this.dataObject = geoData.simple;
  yield next;
}

function* coalitionForecastData(next){
  var rawData = yield request( coalitionProbabilities );
  this.dataObject = coalitionDataParse(rawData.body);
  yield next;
}

function* battlegroundData(next){
  var groups = yield request( battlegrounds );
  var current = yield request( resultNow );
  var locations = yield request( coordinates );
  var constituencyDetails = yield request( details );
  var prediction = yield request( forecast.prediction );

  this.dataObject = slopeDataParse(groups.body, current.body, prediction.body, locations.body, constituencyDetails.body);
  yield next;
}

function* forecastData(next){

  var spreadsheet = yield request( forecast[this.item] );
  var timestamp = yield request( forecast.updated );

  this.dataObject = {
    data:d3.tsv.parse(spreadsheet.body),
    updated:JSON.parse(timestamp.body).updated,
    source:{
      name:'electionforecast.co.uk',
      link:'http://www.electionforecast.co.uk'
    }
  };
  yield next;
}

function* dataResponse(next){
  this.body = this.dataObject;
  yield next;
}

module.exports ={
  routes:main,
  forecastData:forecastData,
  battlegroundData:battlegroundData,
  coalitionForecastData:coalitionForecastData
};

if (!module.parent) main().listen(process.env.PORT || 5000);
