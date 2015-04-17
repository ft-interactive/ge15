'use strict';
var d3 = require('d3');
var _indexBy = require('lodash-node/modern/collections/indexby');
var parties = require('uk-political-parties');

module.exports = function(data){
  var dateFormat = d3.time.format("%Y-%m-%d");

  var config = {
    dateDomain:null,
    valueDomain:null,
    pollPointRadius:3,
    transitionDuration:4000,
    parties:['lab', 'c', 'ukip', 'ld', 'green']
  };

  var processedData = {};


  function pollTracker(parent){
    if(processedData === {}) { return undefined; }
    if(!config.dateDomain){
      config.dateDomain = d3.extent(processedData.polls, function(d){ return d.date; });
    }
    if(!config.valueDomain){
      var max = d3.max(processedData.polls, function(d){ return d.max; });
      config.valueDomain = [0, max];
    }
    function byDateDomain(d){
      return (d.date.getTime() > config.dateDomain[0].getTime() &&
      d.date.getTime() < config.dateDomain[1].getTime());
    }

    var filteredData = {
      lines:processedData.lines.filter(byDateDomain),
      polls:processedData.polls.filter(byDateDomain)
    };

    var bounds = parent.node().getBoundingClientRect(),
      margin = { top:15, left:30, bottom:30, right:90 },
      plotWidth = bounds.width - (margin.left + margin.right),
      plotHeight = bounds.height - (margin.top + margin.bottom);

    var timeScale = d3.time.scale()
      .domain(config.dateDomain)
      .range([0, plotWidth]);

    var valueScale = d3.scale.linear()
      .domain(config.valueDomain)
      .range([plotHeight, 0]).nice();

    var plotEnter =parent.selectAll('svg').data([filteredData])
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

    var plot = d3.select('.poll-visualisation__plot');

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

    function lineInterpolator(party){
      return d3.svg.line()
        .interpolate("linear")
        .x( function(d) { return timeScale( d.date ); })
        .y( function(d) { return valueScale( d.rs[party].v ); });
    }

    plotEnter.append('g').attr({
      'class':'x axis',
      'transform':'translate(0,'+ plotHeight +')'
    });

    plotEnter.append('g').attr('class','y axis');

    plot.select('.x.axis')
      .transition()
      .duration(config.transitionDuration)
        .call(xAxis);

    plot.select('.y.axis')
      .transition()
      .duration(config.transitionDuration)
        .call(yAxis);

    var polls = plot.append('g').attr('class','poll-visualisation__points');


    var pollDataJoin = polls.selectAll('poll-visualisation__poll')
      .data(filteredData.polls);

    pollDataJoin.enter().append("g")
      .attr({
        'class':'poll-visualisation__poll',
        'transform':function(d){
          return 'translate(' + timeScale(d.date) + ', 0)';
        }
      })
      .call(plotPoll);

    pollDataJoin.exit().remove();

    var pollOfPollLines = plot.selectAll('path.poll-visualisation__line')
      .data( config.parties );

    pollOfPollLines.enter().append('path')
      .attr('class',function(d){ return 'poll-visualisation__line ' + parties.className(d)+'-edge' })
      .attr('d', function(d) { return lineInterpolator(d)( filteredData.lines ); });

    pollOfPollLines.exit().remove();
    pollOfPollLines.transition()
      .duration( config.transitionDuration )
      .attr('d', function(d) { return lineInterpolator(d)( filteredData.lines ); });


    var labels = plot.selectAll('text.poll-visualisation__label')
      .data( config.parties, function(d){ return d; } );

    labels.enter().append('text')
      .attr({
        'class':function(d){
          return parties.className(d) + '-text';
        },
        x:plotWidth,
        y:function(d){
          return valueScale(filteredData.lines[0].rs[d].v);
        }
      }).text(function(d){
        return parties.shortName(d) + ' ' + d3.round(filteredData.lines[0].rs[d].v,1) + '%';
      });

    labels.exit().remove();
    labels.transition().duration( config.transitionDuration)
      .attr('y',function(d){
        return valueScale(filteredData.lines[0].rs[d].v);
      });

    function plotPoll(parent){
      var dataJoin = parent.selectAll('circle.poll-visualisation__point').data(function(d){
        return d.rs.filter(function(e){ return (config.parties.indexOf(e.p) > -1) });
      });

      dataJoin
        .enter().append('circle').attr('class','poll-visualisation__point');

      dataJoin.exit().remove();

      dataJoin.transition().duration(config.transitionDuration)
        .attr({
          cx:0,
          cy:function(d){
            return valueScale(d.v);
          },
          r:config.pollPointRadius,
          'class':function(d){ return 'poll-visualisation__point ' + parties.className(d.p)+'-area' }
        });
      }
  }


  pollTracker.pollPointRadius = function(r){
    if(!r) return config.pollPointRadius;
    config.pollPointRadius = r;
    return pollTracker;
  };

  pollTracker.parties = function(a){
    if(!a) return config.parties;
    config.parties = a;
    return pollTracker;
  };

  pollTracker.data = function(rawData){
    if(!rawData){ return processedData; }

    rawData.polls = rawData.polls.map(function(d){
      d.date = dateFormat.parse(d.dt);
      d.max = d3.max(d.rs, function(e){ return e.v; });
      return d;
    });

    rawData.lines = rawData.lines.map(function(d){
      d.date = dateFormat.parse(d.dt);
      d.rs = _indexBy(d.rs,'p');
      return d;
    });

    processedData = rawData;
    return pollTracker;
  };

  pollTracker.dateDomain = function(a){
    if(!a) return config.dateDomain;
    config.dateDomain = a;
    return pollTracker;
  };

  pollTracker.valueDomain = function(a){
    if(!a) return config.valueDomain;
    config.valueDomain = a;
    return pollTracker;
  };

  return pollTracker;
};
