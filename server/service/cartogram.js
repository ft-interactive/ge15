'use strict';

const db = require('./db');

var expires;
var last;
var age = 1000 * 60;

module.exports = function() {

  if (last && expires && Date.now() < expires) {
    return last;
  }

  expires = Date.now() + age;

  last = Promise.resolve({seats: db.seats().find().map(function(seat){
    return {
      id: seat.id,
      name: seat.name,
      slug: seat.slug,
      party: seat.elections.ge15.winner.party,
      x: seat.geo.cartogram.x,
      y: seat.geo.cartogram.y
    };
  })});

  return last;

};
