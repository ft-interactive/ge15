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

  function chart(g){

    //slope

    g.append('line').attr({
      'x1': 0,
      'y1': function(d){ return d.slopeStart; },
      'x2': width,
      'y2': function(d){ return d.slopeEnd; },
      'class':slopeClass
    });


    //start point

    g.append('circle').attr({
      'class':startClass,
      'r':radius,
      'cx':0,
      'cy':function(d){ return d.slopeStart; }
    });

    //end point
    g.append('circle').attr({
      'class':endClass,
      'r':radius,
      'cx':width,
      'cy':function(d){ return d.slopeEnd; }
    });

    g.append('text').attr({
      x:width,
      y:function(d){ return d.slopeEnd; },
      'class':labelClass,
      transform:endLabelOffset
    }).text(label);
  }

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
  chart.labelClass = function(f){
    labelClass = f;
    return chart;
  };

  return chart;
}

module.exports = slopeChart;
