'use strict';
var d3 = require('d3');
d3.sankey = require('./sankey/d3plugin.js');

var sankeyData = require('./sankey/sankey-data.js');
var latestPredictions = 'http://ig.ft.com/data/electionforecast-co-uk/tsv/prediction-latest';

d3.tsv(latestPredictions, drawSankey);

function drawSankey(data){
  data = sankeyData(data);
}
