'use strict';
var d3 = require('d3');
var parties = require('uk-political-parties');
var _zipObject= require('lodash/array/zipObject');
var _pairs = require('lodash/object/pairs');

module.exports = function(parent){

  var margin = {top:2,bottom:2,left:0,right:0};
  var data = [];
  var cells = parent.selectAll('.stacked-bar-column');

  cells.each(function(d,i){
    data.push(this.dataset);
  });

  data = data.map(function(d){
    var partiesArray = [];
    if(d.seats && d.parties){
      partiesArray = _zipObject(d.parties.split(','), d.seats.split(',').map( Number ));
    }
    return {
      label: d.label,
      total: Number(d.seatstotal),
      parties: partiesArray
    };
  });

  var domain = [0, Math.max(330, d3.max(data, function(d){ return d.total; }))];
  var cellSize = d3.select('div.stacked-bar-column .visualisation').node().getBoundingClientRect();

  var barWidth = cellSize.width;
  var barHeight = 20;
  var barScale = d3.scale.linear()
    .range( [0, cellSize.width-(margin.left+margin.right)] )
    .domain( domain );

  cells.select('.visualisation').data(data)
    .append('svg').attr({
      width:barWidth,
      height:barHeight+(margin.top+margin.bottom)
    }).append('g')
    .attr({
      class:'coalition-cell-bar',
      transform:'translate('+margin.left+','+margin.top+')'
    });

  d3.selectAll('g.coalition-cell-bar')
    .call(markers,[326])
     .call(stack)
     .call(label);

  function markers(parent, marks){
    parent.selectAll('.bar-marker')
    .data(marks)
    .enter()
    .append('rect')
    .attr({
      x:0,
      y:0,
      width:barScale,
      height:barHeight,
      'class':'bar-marker'
    });

    return parent;
  }

  function label(parent){
    parent.filter(function(d){
      return (d.label !== undefined);
    }).append('text')
    .text(function(d){
      return d.label;
    })
    .attr({
      'text-anchor':'end',
      'class':'bar-label',
      transform:function(d){ return 'translate(' + (barScale(d.total) - 2) + ',16)'; }
    });
    return parent;
  }

  function stack(parent){

    function stackData(d){
      var paired = _pairs(d.parties).map(function(a){
        return {
          party:a[0],
          seats:a[1]
        };
      });
      var total = 0;
      for(var p = 0; p<paired.length; p++){
        paired[p].cumulativeSeats = total;
        total+=paired[p].seats;
      }
      return paired;
    }

    parent.selectAll('rect.stack-element')
      .data(stackData)
      .enter()
        .append('rect')
          .attr({
            'class': function(d){ return 'stack-element ' + parties.className(d.party)+'-area' },
            x: function(d){return barScale(d.cumulativeSeats); },
            y: 0,
            width: function(d){return barScale(d.seats); },
            height: barHeight
          });
  }

};
