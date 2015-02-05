'use strict';
var d3 = require('d3');

document.graphics = {};
document.data = {};
document.tables = {};

document.graphics.slope = require('./slope-chart/index.js');
document.graphics.constituencyLocator = require('./locator-map/constituency-locator.js');

document.tables.forecastSummary = require('./data-table/forecast-summary.js');

document.data.processForecastData = require('./data/slope-data.js');
document.data.partyShortNames = require('./data/party-data.js').shortNames;

console.log('Group forecast slopes');

var mapURL = 'https://gist.githubusercontent.com/tomgp/8defaceafdce7a11cc7a/raw/991ac83d5a6905b7946fd49ce8bd71a1c986de4c/simplemap.topojson',
  dataURL = 'http://bertha.ig.ft.com/view/publish/ig/0AtxzL7xNk41FdHpvYkNPNlBnd1FXaUhFTXFUeG15VWc/basic,resultnow,details,predictions,coordinates',
  slopeAspect = 1;

loaded();

function loaded(){
  var graphics = document.graphics,
  width = 180,
  height = 100,
  margin = {top:5,left:2,bottom:5,right:40},
  slopeHeight = height - (margin.top + margin.bottom),
  slopeWidth = width - (margin.left + margin.right),

  slopeScale = d3.scale.linear()
    .domain([0,70])
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
    .radius(2)
    .endClass(function(d){
      return  ' end-point ' +d.data.party;
    })
    .startClass(function(d){
      return d.data.party + ' start-point';
    })
    .slopeClass(function(d){
      return d.data.party + ' slope';
    })
    .labelClass(function(d){
      return d.data.party + ' slope-label';
    })
    .label(function(d,i){
      if( d.data.winner ){
        return document.data.partyShortNames[d.data.party];
      }
    })
    .scale(slopeScale);

  function status(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  }

  function toJson(response) {
    return response.json();
  }

  Promise.all([
    fetch(dataURL).then(status).then(toJson),
    fetch(mapURL).then(status).then(toJson),
    ]).then(function onData(responses) {
      gotData(undefined, responses[0], responses[1]);
      window.redrawSlopes();
    });

  function gotData(error, data, map){
    var groups = document.data.processForecastData(data);
    var divs = d3.select('#slope-groups')
      .selectAll('div.group')
      .data(groups)
      .enter()
      .append('div')  //class="figure constituency-group constituency-group--slope o-grid-row" data-o-grid-colspan="12"
      .attr({
        'class':'figure constituency-group constituency-group--slope o-grid-row',
        'data-o-grid-colspan':12
      });

    divs.append('h2')
      .attr('class','article-body__subhead figure__title')
      .text(function(d){return d.headline; });

    var overview = divs.append('div')
      .attr({'data-o-grid-colspan':'12 S4 M3 L2'})
      .append('div')
      .attr({'class':'o-grid-row constituency-group__details'});

    overview.call(document.tables.forecastSummary);
    overview.each(function(g,i){
      var locator = graphics.constituencyLocator()
      .map(map)
      .locations(g.constituencies);

      d3.select(this).call(locator);
    });
    divs.call(groupContainer);
  }

  function groupContainer(g){
    g = g.append('div')
      .attr({'data-o-grid-colspan':'12 S8 M9 L10'})
      .append('div')
      .attr({'class':'o-grid-row'});


    var container = g.selectAll('div.constituency').data(function(d){
        return d.constituencies;
      })
      .enter()
      .append('div').attr({
        'class':'constituency-group__slope',
        'data-o-grid-colspan':'4 M3 L2 XL2'
      });

    var divs = container.append('div').attr({
        'class':'constituency-group__slope-graphic'
      });

    container.append('div')
      .attr({
        'class':'constituency-group__constituency-name'
      }).text(function(d){
        return d.name;
      });

    divs.append('svg').attr({
      class:'slope-chart',
      'data-constituency':function(d){ return d.id; },
      viewBox:'0 0 ' + width + ' ' + height + '',
      preserveAspectRatio:'xMinYMid meet',
      width:width,
      height:height
    }).append('g').attr({
      'transform':'translate(' + margin.left + ',' + margin.top + ')'
    }).each(function(d){
      d3.select(this).selectAll('g.slope')
      .data(layout(d.parties).sort(function (a,b){
        if(a.slopeEnd<b.slopeEnd) return -1;
          if(a.slopeEnd>b.slopeEnd) return 1;
            return 0;
          }))
          .call(SVGSlope);
        });
  }

  window.redrawSlopes = function(){
    //Resize the SVG
    var size = d3.select('.constituency-group__slope-graphic').node().getBoundingClientRect();
    
    slopeWidth = size.width - (margin.left + margin.right);
    slopeHeight = slopeWidth/slopeAspect;
    slopeScale.range([slopeHeight,0]);

    SVGSlope
      .width(slopeWidth)
      .scale(slopeScale);

    d3.selectAll('svg.slope-chart').each(function(d,i){
      var w = slopeWidth + (margin.left+margin.right);
      var h = slopeHeight + (margin.top+margin.bottom);

      var svg = d3.select(this);
      svg.selectAll('g.slope').call(SVGSlope.reposition);
      svg.attr({
        width: w,
        height: h,
        viewBox: '0 0 ' + w + ' ' + h + ''
      });
    });
  };
}
