document.graphics = {};
document.data = {};
document.tables = {};

document.graphics.slope = require('./slope-chart/index.js');
document.graphics.constituencyLocator = require('./locator-map/constituency-locator.js');

document.tables.forecastSummary = require('./data-table/forecast-summary.js');

document.data.processForecastData = require('./data/slope-data.js');
document.data.partyShortNames = require('./data/party-data.js').shortNames;

console.log('Group forecast slopes');
