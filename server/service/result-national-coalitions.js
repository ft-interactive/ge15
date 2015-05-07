'use strict';

const db = require('./db');
const _ = require('lodash');

var expires;
var last;
var age = 1000 * 60;
var coalitions = [
  ['c'],
  ['lab'],
  ['ld','c'],
  ['ld','lab'],
  ['snp','lab'],
  ['dup','c'],
  ['ukip','c'],
  ['ld','snp','lab'],
  ['dup','ld','c'],
  ['ukip','ld','c'],
  ['ukip','dup','c'],
  ['ukip','dup','ld','c'],
  ['green','sdlp','snp','lab'],
  ['green','pc','snp','lab'],
  ['green','pc','ld','lab'],
  ['green','sdlp','pc','snp','lab']
];

module.exports = function(){
  if (last && expires && Date.now() < expires) {
    return last;
  }


  var allParties = db.parties().find().map(simplify);
  var partySeats = _.indexBy(allParties, 'party');

  var groups = coalitions.map(function(d){
    var o = {
      parties:d,
      seats:d.reduce(function(previous, current){
        return partySeats[current].seats + previous;
      }, 0)
    };
    o.majority = o.seats - 325;
    return o;
  });

  groups = groups.filter(viable).sort(byMajority);

  expires = Date.now() + age;
  last = Promise.resolve({ groups:groups,number:groups.length });

  return last;
};

function viable(d){
  return (d.majority > -5);
}

function byMajority(a,b){
  return b.majority - a.majority;
}

function simplify(d){
  return {
    party:d.id,
    seats:d.elections.ge15.seats
  };
}
