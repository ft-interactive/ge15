'use strict';

require('fetch');
require('./header.js');

var d3 = require('d3');
var topojson = require('topojson');
//var debounce = require('lodash-node/modern/functions/debounce');

document.graphics = {
  slope:require('./slope-chart/index.js'),
  constituencyLocator:require('./locator-map/constituency-locator.js')
};

document.data = {
  processForecastData:require('./data/slope-data.js'),
  partyShortNames:require('./data/party-data.js').shortNames
};

document.tables = {
  forecastSummary:require('./data-table/forecast-summary.js')
};

document.addEventListener('DOMContentLoaded', function() {
  document.dispatchEvent(new CustomEvent('o.DOMContentLoaded'));
});
