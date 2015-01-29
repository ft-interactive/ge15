'use strict';

var d3 = require('d3');

function slopeLayout(){
  var startAccessor = function(d){
    return d.start;
  };

  var endAccessor = function(d){
    return d.start;
  };

  var scale = d3.scale.linear();

  function slopeData(data){
    return data.map(function(d){
      return {
        slopeStart:scale( startAccessor(d) ),
        slopeEnd:scale( endAccessor(d) ),
        data:d
      };
    });
  }

  slopeData.start = function(f){
    startAccessor = f;
    return slopeData;
  };

  slopeData.end = function(f){
    endAccessor = f;
    return slopeData;
  };

  slopeData.domain = function(a){
    scale.domain(a);
    return slopeData;
  };

  slopeData.range = function(a){
    scale.range(a);
    return slopeData;
  };

  return slopeData;
}

module.exports = slopeLayout;
