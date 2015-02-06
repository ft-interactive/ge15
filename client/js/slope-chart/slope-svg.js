'use strict';

var d3 = require('d3');

function slopeChart(){
  var startClass = d3.functor('start-point');
  var endClass = d3.functor('end-point');
  var radius = d3.functor(5);
  var slopeClass = d3.functor('slope');
  var label = d3.functor('');
  var labelClass = d3.functor('slope-label');
  var endLabelOffset = d3.functor('translate(4,4)');
  var width = 200;
  var scale = d3.scale.linear();

  function chart(g){
    g.enter().append('g').attr('class','slope');

    //slope
    g.append('line')
      .attr({
        'class':slopeClass
      })
      .classed('_slope-line','true');

    //start point
    g.append('circle')
      .attr({
        'class':startClass
      })
      .classed('_slope-start','true');

    //end point
    g.append('circle')
      .attr({
        'class':endClass
      })
      .classed('_slope-end','true');

    g.append('text')
      .attr({
        'class':labelClass
      })
      .text(label)
      .classed('_slope-text','true');

    chart.reposition(g);
  }

  chart.reposition = function(g){
    g.select('._slope-line').attr({
      'x1': 0,
      'y1': function(d){ return scale(d.slopeStart); },
      'x2': width,
      'y2': function(d){ return scale(d.slopeEnd); }
    });

    g.select('._slope-text').attr({
      x:width,
      y:function(d){ return scale(d.slopeEnd); },
      transform:endLabelOffset
    });

    g.select('._slope-end').attr({
      'r':radius,
      'cx':width,
      'cy':function(d){ return scale(d.slopeEnd); }
    });

    g.select('._slope-start').attr({
      'r':radius,
      'cx':0,
      'cy':function(d){ return scale(d.slopeStart); }
    });
  };

  chart.radius = function(f){
    radius = d3.functor(f);
    return chart;
  };

  chart.slopeClass = function(f){
    slopeClass = d3.functor(f);
    return chart;
  };

  chart.startClass = function(f){
    startClass = d3.functor(f);
    return chart;
  };

  chart.endClass = function(f){
    endClass = d3.functor(f);
    return chart;
  };

  chart.width = function(x){
    width = d3.functor(x);
    return chart;
  };

  chart.label = function(f){
    label = f;
    return chart;
  };

  chart.labelClass = function(f){
    labelClass = f;
    return chart;
  };

  chart.scale = function(x){
    scale = x;
    return chart;
  };

  return chart;
}

module.exports = slopeChart;
