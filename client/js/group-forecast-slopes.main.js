'use strict';

/* global battlegrounds */

var d3 = require('d3');
var debounce = require('lodash/function/debounce');
var parties = require('uk-political-parties');

var mapData = 'http://interactivegraphics.ft-static.com/data/geo/uk/simplemap.json';

var doc = document;

doc.graphics = {};
doc.graphics.slope = require('./slope-chart/index.js');
doc.graphics.constituencyLocator = require('./locator-map/constituency-locator.js');
doc.graphics.resultTableDecorator = require('./table/projections-decorator.js');
doc.graphics.coalitionsTableDecorator = require('./table/coalitions-decorator.js');
doc.graphics.pollTracker = require('./polltracker/index.js');

doc.data = {};
doc.data.constituencyLookup = {};

battlegrounds.forEach( function(battle){
  battle.constituencies.forEach( function(constituency){
    doc.data.constituencyLookup[ constituency.id ] = constituency;
  });
});

main();

function main(){
  var graphics = doc.graphics;
  var width = 180;
  var height = 100;
  var dotRadius = 2;
  var partyLabel = {
    width: 38,
    height: 10
  };
  var margin = {
    top: partyLabel.height,
    left: dotRadius,
    bottom: partyLabel.height / 2,
    right: partyLabel.width
  };
  var slopeHeight = height - (margin.top + margin.bottom);
  var slopeWidth = width - (margin.left + margin.right);

  var slopeScale = d3.scale.linear()
    .domain([0,76])
    .range([slopeHeight,0]);

  var layout = graphics.slope.layout()
    .start(function(d){
      return d.resultnow;
    })
    .end(function(d){
      return d.resultprediction;
    });

  var SVGSlope = graphics.slope.svg()
    .width(slopeWidth)
    .radius(dotRadius)
    .endClass(function(d){
      return ' end-point ' + parties.className(d.data.party);
    })
    .startClass(function(d){
      return parties.className(d.data.party) + ' start-point';
    })
    .slopeClass(function(d){
      return parties.className(d.data.party) + ' slope';
    })
    .labelClass(function(d){
      return parties.className(d.data.party) + ' slope-label';
    })
    .label(function(d,i){
      if( d.data.winner ){
        return parties.shortName(d.data.party);
      }
    })
    .scale(slopeScale);


  var slopeContainers = d3.selectAll('.constituency-group__slope-graphic').datum( function(){
      var datum = doc.data.constituencyLookup[this.dataset.constituency];
      datum.axes = (Number(this.dataset.order) === 0);
      return datum;
  });

  slopeContainers.append('svg').attr({
      class: 'slope-chart',
      'data-constituency': function(d) { return d.id; },
      width: width,
      height: height
    })
    .append('g').attr({
      transform: 'translate(' + margin.left + ',' + margin.top + ')'
    })
    .each(function(d,i){
      if(d.axes){
        var axis = d3.select(this).append('g')
          .attr({
            class:'slope-axes'
          }).selectAll('g').data(['Last vote','Polling'])
            .enter()
              .append('g')
              .attr({
                'transform':function(d,i){
                  return 'translate('+(i*width)+',0)';
                },
                'class':'slope-axis'
              });

        axis.append('line').attr({
          class:'axis-line',
          x1:0, y1:3,
          x2:0, y2:height
        });
        axis.append('text')
          .attr({
            'class':'axis-label'
          })
          .text(function(d){ return d; });
      }
      d3.select(this).selectAll('g.slope')
        .data( layout(d.parties) )
        .call(SVGSlope, d.axes);
    });

  redrawSlopes();
  var resize = debounce(function(e) {
    redrawSlopes();
  }, 200);
  window.addEventListener('resize', resize, false);

  function redrawSlopes(){
    //Resize the SVG
    var el = d3.select('.constituency-group__slope-graphic').node();
    var size = el.getBoundingClientRect();
    var overhang = 12;
    slopeWidth = size.width + overhang - (margin.left + margin.right);
    slopeHeight = size.height  - (margin.top + margin.bottom);
    slopeScale.range([slopeHeight,0]);

    SVGSlope
      .width(slopeWidth)
      .scale(slopeScale);

    d3.selectAll('svg.slope-chart').each(function(d, i) {
      var w = slopeWidth + margin.left + margin.right;
      var h = slopeHeight + margin.top + margin.bottom;

      var svg = d3.select(this);
      svg.selectAll('g.slope-axis')
        .attr('transform',function(d,i){
          return 'translate('+(i*slopeWidth)+',0)';
        });

      svg.selectAll('g.slope').call(SVGSlope.reposition);
      svg.attr({
        width: w,
        height: h
      });
    });
  }

  //decorate the results table
  d3.select('.result-table')
    .call(doc.graphics.resultTableDecorator);

  //decorate the coalition table
  d3.select('.coalition-table')
    .call(doc.graphics.coalitionsTableDecorator);

  //create polltracker
  d3.json('http://interactivegraphics.ft-static.com/data/uk-polling-data/polltracker.json',function(error, data){
    var pollViz = doc.graphics.pollTracker();

    pollViz
      .data(data)
      .dateDomain([new Date(2014,10,1), new Date()])
      .valueDomain([0,40]);

    d3.select('.poll-visualisation')
      .call(pollViz);

    pollViz.dateDomain([new Date(2013, 10, 1), new Date()]);
    d3.select('.poll-visualisation')
      .call(pollViz);

  });



  //load and draw the map
  d3.json(mapData,function(map){
    d3.selectAll('.constituency-group__locator-map-ratio').datum( function(){
      return battlegrounds[this.dataset.group];
    }).each(function(g,i){
      var locator = graphics.constituencyLocator()
        .width(this.offsetWidth)
        .height(this.offsetHeight)
        .map(map)
        .locations(g.constituencies);
      d3.select(this).call(locator);
    });
  });
}
