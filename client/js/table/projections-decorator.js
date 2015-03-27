'use strict';
var d3 = require('d3');
var parties = require('uk-political-parties');

module.exports = function(parent){

  var margin = {top:2,bottom:2,left:0,right:0};
  var data = [];
  var cells = parent.selectAll('.bar-column');


  cells.each(function(d,i){
    data.push(this.dataset);
  });

  var domain = [0, Math.max(330, d3.max(data, function(d){ return d.high; }))];
  var cellSize = d3.select('div.bar-column .visualisation').node().getBoundingClientRect();
  console.log(domain);

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
        class:'result-cell-bar',
        transform:'translate('+margin.left+','+margin.top+')'
      });

  d3.selectAll('g.result-cell-bar')
    .call(markers,[326])
    .call(bar)
    .call(label);

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
        transform:function(d){ return 'translate(' + (barScale(d.seats) - 2) + ',16)'; }
      });
    return parent;
  }

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

  function bar(parent){
    parent.selectAll('.party-bar')
      .data(function(d){ return [d] })
      .enter()
      .append('rect')
      .attr({
        width:function(d){ return barScale(d.seats); },
        height:barHeight,
        'class':function(d){ return parties.className(d.party) + '-area party-bar'; }
      });

    parent.selectAll('.party-bar')
    .attr({
      width:function(d){ return barScale(d.seats); },
      height:barHeight,
      'class':function(d){
        if(d.party === 'none'){
          return 'none';
        }
        return parties.className(d.party) + '-area party-bar';
      }
    });

    return parent;
  }
};




function valueDisplay(parent){
  console.log('value',  parent);
  return parent;
}
