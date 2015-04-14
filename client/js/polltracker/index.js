'use strict';
var d3 = require('d3');
var _groupBy = require('lodash-node/modern/collections/groupby');

module.exports = function(data){
  console.log('POLLS!');
  var dateFormat = d3.time.format("%Y-%m-%d");
  var dateDomain = [ dateFormat.parse("2014-10-01"), new Date() ];
  var valueDomain = [ 0, 100 ];
  var processedData = {};

  function pollTracker(parent){
    console.log('polls from ', dateDomain, 'between ', valueDomain);
    if(processedData === {}) { return undefined; }

    var bounds = parent.node().getBoundingClientRect(),
      margin = { top:5, left:30, bottom:30, right:60 },
      plotWidth = bounds.width - (margin.left + margin.right),
      plotHeight = bounds.height - (margin.top + margin.bottom);

    var timeScale = d3.time.scale()
      .domain(dateDomain)
      .range([0, plotWidth]);

    var valueScale = d3.scale.linear()
      .domain(valueDomain)
      .range([plotHeight, 0]);

    var plot = parent.selectAll('svg').data([processedData])
      .enter()
      .append('svg')
        .attr({
          width:Math.floor(bounds.width),
          height:Math.floor(bounds.height),
          'class':'poll-visualisation__graphic'
        })
      .append('g')
        .attr({
          'class':'poll-visualisation__plot',
          'transform':'translate('+margin.left+','+margin.top+')'
        });

    var xAxis = d3.svg.axis()
      .scale(timeScale)
      .orient("bottom")
      .tickFormat(d3.time.format("%b '%y"))
      .ticks(5)
      .tickSize(5);

    var yAxis = d3.svg.axis()
      .scale(valueScale)
      .orient("left")
      .ticks(5)
      .tickSize(5);

    var line = d3.svg.line()
      .interpolate("linear")
      .x( function(d) { return timeScale( d.date ); })
      .y( function(d) { return valueScale( d.val ); });

    plot.append('g').attr({
      'class':'x axis',
      'transform':'translate(0,'+ plotHeight +')'
    }).call(xAxis);

    plot.append('g').attr('class','y axis').call(yAxis);

  }



  pollTracker.data = function(rawData){
    if(!rawData){ return processedData; }
      rawData = rawData.map(function (d){
      return{
        date: dateFormat.parse(d.datetext),
        party: d.variable,
        val: +d.value,
        filter: d.shape
      };
    }).reverse();

    var split = _groupBy(data, function(d){
      return d.filter;
    });

    processedData = {
      pointsData:_groupBy(split['points'], 'party'),
      linesData:_groupBy(split['lines'], 'party')
    };

    return pollTracker;
  };

  pollTracker.dateDomain = function(a){
    if(!a) return dateDomain;
    dateDomain = a;
    return pollTracker;
  };

  pollTracker.valueDomain = function(a){
    if(!a) return valueDomain;
    valueDomain = a;
    return pollTracker;
  };

  return pollTracker;
};
