'use strict';

function slopeLayout(){
  var startAccessor = function(d){
    return d.start;
  };

  var endAccessor = function(d){
    return d.start;
  };

  function slopeData(data){
    return data.map(function(d){
      return {
        slopeStart:startAccessor(d),
        slopeEnd:endAccessor(d),
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

  return slopeData;
}

module.exports = slopeLayout;
