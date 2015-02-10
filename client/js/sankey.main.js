'use strict';
var d3 = require('d3');
d3.sankey = require('./sankey/d3plugin.js');
var debounce = require('lodash-node/modern/functions/debounce');
var party = require('./data/party-data.js');
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

  d3.select('#sankey svg').remove();
  var parentSize = d3.select('#sankey').node().getBoundingClientRect();
  var height = 500;
  var width = parentSize.width;
  var margin = {top:30,left:0,bottom:10,right:10};
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
      height:height,
      id:'sankey-graphic'
    });

  var gradients = svg.append('defs').selectAll('linearGradient').data(data.links)
    .enter()
      .append('linearGradient')
        .attr({
          id:gradientName,
          x1:'0%',
          x2:'100%',
          y1:'0%',
          y2:'0%'
        });

  gradients.append('stop')
    .attr({
      offset:'0%'
    })
    .style('stop-color',function(d){
      return partyColour(d.source.name);
    })
    .style('stop-opacity',1);

  gradients.append('stop')
    .attr({
      offset:'100%'
    })
    .style('stop-color',function(d){
      return partyColour(d.target.name);
    })
    .style('stop-opacity',1);

  svg.selectAll('text.axis-label').data(['2010','2015'])
    .enter()
      .append('text')
        .attr({
          'class':'axis-label',
          'text-anchor':function(d,i){
            if(i===0) return 'start';
            return 'end';
          },
          'transform':function(d,i){
            var xPos = (width-margin.right)*i;
            var yPos = margin.top - 4;
            return 'translate('+xPos+','+yPos+')';
          }
        }).text(function(d){ return d; });

  svg = svg.append('g')
      .attr('transform','translate('+margin.left+','+margin.top+')');

  svg.append('g').selectAll('.link')
      .data(data.links)
    .enter()
      .append('path')
      .attr({
        'class':function(d){ return 'link ' + linkClass(d); },
        'data-from':function(d){ return d.source.name; },
        'data-to':function(d){ return d.target.name; },
        'd':path
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
      return 'node ' + d.name;
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
    .text(function(d) {
      var partyCode = party.fullNameToCode[d.name];
      return party.shortNames[partyCode] + ' ('+d.value + ')'; })
    .filter(function(d) { return d.x < width / 2; })
    .attr({
      'x':6 + sankey.nodeWidth(),
      'text-anchor':'start'
    });

  function clearSelections(){
    //unselect all the nodes
    d3.selectAll('rect')
      .classed('selected', false);
    //unselect all the links
    d3.selectAll('path')
      .classed('selected', false)
      .style('stroke', null)
      .style('stroke-opacity', null);
  }

  function linkClass(d){
      return toClass(d.source.name + '-to-' +d.target.name);
  }

  function gradientName(d){
    return ( toClass(d.source.name) + '--' + toClass(d.target.name) + '-gradient');
  }

  function partyColour(p){
    var partyCode = party.fullNameToCode[p];
    console.log(partyCode);
    return party.colours[partyCode];
  }

  d3.selectAll('rect').on('click',function(d){
    clearSelections();
    //mark this node as selected
    d3.select(this).classed('selected', true);
    if(d.x === 0){ //if it's on the left
        d.sourceLinks.forEach(function(link){
        d3.selectAll('.'+linkClass(link))
          .classed('selected',true)
          .style('stroke', function(d){
            return 'url(#'+gradientName(d)+')';
          })
          .style('stroke-opacity',1);
      });
    }else{ //if it's on the right
      d.targetLinks.forEach(function(link){
        d3.selectAll('.'+linkClass(link)).classed('selected',true)
        .style('stroke', function(d){
          return 'url(#'+gradientName(d)+')';
        })
        .style('stroke-opacity',1);
      });
    }
  });

  d3.selectAll('path').on('click',function(d){
    clearSelections();
    d3.select(this).classed('selected', true);
    console.log('d ', d);
  });
}
