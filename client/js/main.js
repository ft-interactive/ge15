'use strict';

require('fetch');
require('./header.js');

document.graphics = {};
document.data = {};
document.tables = {};

document.graphics.slope = require('./slope-chart/index.js');
document.graphics.constituencyLocator = require('./locator-map/constituency-locator.js');

document.tables.forecastSummary = require('./data-table/forecast-summary.js');

document.data.processForecastData = require('./data/slope-data.js');
document.data.partyShortNames = require('./data/party-data.js').shortNames;

document.addEventListener('DOMContentLoaded', function() {
  document.dispatchEvent(new CustomEvent('o.DOMContentLoaded'));
});
