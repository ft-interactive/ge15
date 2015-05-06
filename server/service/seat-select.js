'use strict';

var list = require('./db').seats().find().map(function(seat){
  return {
    id: seat.id,
    name: seat.name,
    region: seat.region_name
  };
});

module.exports = function() {
  return list;
};
