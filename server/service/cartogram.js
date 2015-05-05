'use strict';

const db = require('./db');

var last = pluck('last');
var ge15_projection = pluck('ge15_projection');
var ge15 = pluck('ge15');

function pluck(election) {
  return Promise.resolve(db.seats().find().map(function(seat){
    return {
      id: seat.id,
      name: seat.name,
      slug: seat.slug,
      party: seat.elections[election].winner.party,
      x: seat.geo.cartogram.x,
      y: seat.geo.cartogram.y
    };
  }));
}

module.exports = function(election) {
  if (election === 'last') {
    return last;
  } else if (election === 'ge15-projection') {
    return ge15_projection;
  } else if (election === 'ge15') {
    return ge15;
  }

  throw new Error('Unknown election');
};
