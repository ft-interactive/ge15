/* global sankeyData */
'use strict';

var d3 = require('d3');
var ukParties = require('uk-political-parties');
d3.sankey = require('../sankey/d3plugin.js');
var debounce = require('lodash/function/debounce');

module.exports = function(){
  console.log('sankey');
  if(sankeyData){
    d3.select('.results-sankey').call(drawSankey, sankeyData);

    var resize = debounce(function(e) {
      d3.select('.results-sankey').call(drawSankey, sankeyData);
    }, 50);

    window.addEventListener('resize', resize, false);

    d3.select('#flow-all').on('click', function(){
      d3.event.preventDefault();
      d3.selectAll('.link').classed('selected',true)
        .style('stroke', selectedStrokeStyle)
        .style('stroke-opacity',1);
      return false;
    });
    d3.select('#flow-reset').on('click', function(){
      d3.event.preventDefault();
      d3.selectAll('.link').classed('selected',false);
      return false;
    });
  }
};


function drawSankey(parent, data){

  parent.select('svg').remove();
  var parentSize = parent.node().getBoundingClientRect();
  var height = 540;
  var width = parentSize.width;
  var margin = {top:30,left:0,bottom:40,right:0};
  var chartHeight = height - (margin.top + margin.bottom);
  var chartWidth = width - (margin.left + margin.right);
  var nodePadding = 20;
  var nodeWidth = 30;

  var sankey = d3.sankey()
    .size([chartWidth, chartHeight])
    .nodeWidth(nodeWidth)
    .nodePadding(nodePadding)
    .nodes(data.nodes)
    .links(data.links)
    .layout(32);

  var path = sankey.link();

  var svg = parent.append('svg')
    .attr({
      width: width,
      height: height,
      class: 'sankey'
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

  svg.selectAll('text.axis-label').data(['Last election','Now'])
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
        var yPos = margin.top - 8;
        return 'translate('+xPos+','+yPos+')';
      }
    }).text(function(d){ return d; });

  svg = svg.append('g')
    .attr('transform','translate('+margin.left+','+margin.top+')');

  var link = svg.append('g').selectAll('.link')
    .data(data.links)
      .enter()
        .append('g')
        .attr('class','link-container');

  link.append('path')
      .attr({
        'class':function(d){ return 'link ' + linkClass(d); },
        'data-from':function(d){ return partyClass(d.source.name); },
        'data-to':function(d){ return partyClass(d.target.name); },
        'd':path
      })
      .style('stroke-width', function(d) { return Math.max(1, d.dy); });

  link.append('text')
    .attr({
      'x':nodeWidth +6,
      'y':function(d) {
        return d.source.y + d.sy + (d.dy/2);
      },
      'data-from':function(d){ return partyClass(d.source.name); },
      'data-to':function(d){ return partyClass(d.target.name); },
      'class':'source link-label inactive',
      'dy':'.35em'
    })
    .text(function(d){
      return partyShortName(d.source.name) +': '+ d.value;
    });

    link.append('text')
      .attr({
        'x':chartWidth - (nodeWidth +6),
        'y':function(d) {
          return d.target.y + d.ty + (d.dy/2);
        },
        'data-from':function(d){ return ukParties.className(d.source.name); },
        'data-to':function(d){ return ukParties.className(d.target.name); },
        'dy':'.35em',
        'class':'target link-label inactive',
        'text-anchor':'end'
      })
      .text(function(d){
        return partyShortName(d.target.name) +': '+ d.value;
      });

    var node = svg.append('g').selectAll('.node')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });

    node.append('rect')
      .attr('height', function(d) { return Math.max(1, d.dy); })
      .attr('width', sankey.nodeWidth())
      .attr('class',function(d){
        return 'node ' + partyClass(d.name) + '-area';
      })
      .append('title')
      .text(function(d) { return d.name + " " + d.value; });

    node.append('rect')
      .attr('height', function(d) { return d.dy + nodePadding; })
      .attr('y', function(d) {
        return -nodePadding/2;
      })
      .attr('x', function(d){
        if(d.x>chartWidth/2) return -chartWidth/2 + sankey.nodeWidth();
        return 0;
      })
      .attr('width', chartWidth/2)
      .attr('class','selection-rect')
      .append('title')
      .text(function(d) { return d.name + " " + d.value; });

    node.append('text')
      .attr({
        'x':-6,
        'y':function(d) { return d.dy / 2; },
        'dy':'.35em',
        'text-anchor':'end',
        'transform':null,
        'class':'target node-label',
        'data-party':function(d){ return partyClass(d.name); }
      })
      .text(function(d) {
        return partyShortName(d.name) + ': '+d.value ; }) //TODO
        .filter(function(d) { return d.x < width / 2; })
        .attr({
          'x':6 + sankey.nodeWidth(),
          'class':'source node-label',
          'text-anchor':'start'
        });

    d3.selectAll('.node')
      .on('click',function(d){
        clearSelections();
        var selectionList = buildSelectionList(d);
        selectLink( selectionList.list.join(', ') );
        activateLabels(selectionList.direction, selectionList.party);
      })
      .on('mouseover',function(d){
        clearHint();
        pathHint( buildSelectionList(d).list.join(', ') );
      })
      .on('mouseout', function(){
        clearHint();
      });

      d3.selectAll('path')
      .on('click',function(d){
        clearSelections();
        selectLink( '.'+linkClass(d) );
        activateLabels('both', d.source.name, d.target.name);
      });
}

function buildSelectionList(d){
  var selectionList = [];
  var direction = 'to';
  var party = '';
  d.sourceLinks.forEach(function(link){
    selectionList.push('.'+linkClass(link));
    direction = 'from';
    party = link.source.name;
  });
  d.targetLinks.forEach(function(link){
    selectionList.push('.'+linkClass(link));
    party = link.target.name;
  });
  return {list:selectionList, direction:direction, party:party};
}

function clearHint(){
  d3.selectAll('path.link')
    .classed('hint', false);
}

function pathHint(selectionString){
  d3.selectAll(selectionString)
    .classed('hint', true);
}

function activateLabels(direction, party1, party2){
  d3.selectAll('text.node-label').classed('inactive', true);
  d3.selectAll('text.link-label').classed('inactive', true);
  if(!direction || !party1){
    d3.selectAll('text.node-label').classed('inactive', false);
    return;
  }
  if(direction === 'both'){
    d3.selectAll('.link-label[data-to="'+partyClass(party2)+'"][data-from="'+partyClass(party1)+'"]')
    .classed('inactive',false);
  }else if(direction === 'to'){
    d3.selectAll('.source.link-label[data-'+direction + '="'+partyClass(party1)+'"]').classed('inactive',false);
    d3.selectAll('.target.node-label[data-party="'+partyClass(party1)+'"]').classed('inactive',false);
  }else{
    d3.selectAll('.target.link-label[data-'+direction + '="'+partyClass(party1)+'"]').classed('inactive',false);
    d3.selectAll('.source.node-label[data-party="'+partyClass(party1)+'"]').classed('inactive',false);
  }
}

function selectedStrokeStyle(d){
  if(d.source.name === d.target.name ){
    return partyColour(d.source.name);
  }
  return 'url(#'+gradientName(d)+')';
}

function selectLink(selectionString){
  d3.selectAll(selectionString)
    .classed('selected',true)
    .style('stroke', selectedStrokeStyle)
    .style('stroke-opacity',1)
    .call(function(d){
      createSummary(d.data());
      return this;
    });
}

function clearSelections(){
  //unselect all the nodes
  d3.selectAll('rect')
    .classed('selected', false);
  //unselect all the links
  d3.selectAll('path')
    .classed('selected', false)
    .style('stroke', null)
    .style('stroke-opacity', null);

  //de activate link text
  d3.selectAll('text.line-label').classed('inactive', true);
  //activate node text
  d3.selectAll('.node text').classed('inactive', false);
}

function gradientName(d){
  return ( partyClass(d.source.name) + '--' + partyClass(d.target.name) + '-gradient');
}

function linkClass(d){
  return partyClass(d.source.name) + '-to-' + partyClass(d.target.name);
}

function createSummary(data){
  function linkDescription(l, target){
    var seats = 'seats';
    if(l.value === 1){
      seats = 'seat';
    }
    if(l.source.name === l.target.name){
      return (l.source.name + ' retain <b>' + l.value + '</b> ' + seats);
    }else{
      if(target){
        return (l.source.name + ' lose <b>' + l.value + '</b> ' + seats + ' to ' + l.target.name);
      }else{
        return (l.target.name + ' gain <b>' + l.value + '</b> ' + seats + ' from ' + l.source.name);
      }
    }
    return '';
  }

  var links = data.sort(function(a,b){return b.value - a.value; });
  var listItems = d3.selectAll('.info-pane').selectAll('div').data(links);
  listItems.exit().remove();
  listItems.enter().append('div');

  var target = false;
  if(data.length > 1 ){
    target = (data[0].target !== data[1].target);
  }

  listItems.html(function(d){ return linkDescription(d,target); });
}

function partyClass(p){
  if(ukParties.className(p)) return ukParties.className(p);
  return 'undeclared';
}

function partyShortName(p){
  if(ukParties.shortName(p)) return ukParties.shortName(p);
  return 'not declared';
}
function partyColour(p){
  if(ukParties.colour(p)) return ukParties.colour(p);
  return '#74736c';

}
