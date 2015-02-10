'use strict';
var d3 = require('d3');
d3.sankey = require('./sankey/d3plugin.js');
var debounce = require('lodash-node/modern/functions/debounce');

var sankeyData = require('./sankey/sankey-data.js');
var latestPredictions = 'http://ig.ft.com/data/electionforecast-co-uk/tsv/prediction-latest';

d3.tsv(latestPredictions, function(d){
  var data = sankeyData(d);
  var resize = debounce(function(e) {
    drawSankey(data);
  }, 200);
  window.addEventListener("resize", resize, false);
  drawSankey(data);
});

function drawSankey(data){

  function toClass(str){ return str.replace(/\s/g,'_'); }
  console.log('drawing sankey');
  d3.select('#sankey svg').remove();
  var parentSize = d3.select('#sankey').node().getBoundingClientRect();
  var height = 500;
  var width = parentSize.width;
  var margin = {top:10,left:0,bottom:10,right:10};
  var chartHeight = height - (margin.top + margin.bottom);
  var chartWidth = width - (margin.left + margin.right);

  var sankey = d3.sankey()
    .size([chartWidth, chartHeight])
    .nodeWidth(30)
    .nodePadding(20)
    .nodes(data.nodes)
    .links(data.links)
    .layout(32);

  var path = sankey.link();

  var svg = d3.select('#sankey').append('svg')
    .attr({
      width:width,
      height:height
    })
      .append('g')
      .attr('transform','translate('+margin.left+','+margin.top+')');

  var link = svg.append('g').selectAll('.link')
      .data(data.links)
    .enter()
      .append('path')
      .attr({
        'class':function(d){
          return 'link ' + toClass(d.source.name + '-to-' +d.target.name);
        },
        d:path
      })
      .style('stroke-width', function(d) { return Math.max(1, d.dy); });

  var node = svg.append('g').selectAll('.node')
      .data(data.nodes)
    .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });

  node.append('rect')
    .attr('height', function(d) { return d.dy; })
    .attr('width', sankey.nodeWidth())
    .attr('class',function(d){
      return d.name;
    })
      .append('title')
      .text(function(d) { return d.name + " " + d.value; });


  node.append('text')
    .attr({
      'x':-6,
      'y':function(d) { return d.dy / 2; },
      'dy':'.35em',
      'text-anchor':'end',
      'transform':null
    })
    .text(function(d) { return d.name + ' ('+d.value + ')'; })
    .filter(function(d) { return d.x < width / 2; })
    .attr({
      'x':6 + sankey.nodeWidth(),
      'text-anchor':'start'
    });
}
