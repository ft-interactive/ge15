'use strict';

const _ = require('lodash');
const db = require('./db');

var nameOverrides = {
  ld: 'Lib Dems'
};

var expires;
var last;
var age = 1000 * 60;

module.exports = function () {

  if (last && expires && Date.now() < expires) {
    return last;
  }

  var parties = db.parties().find().map(function(party) {

    return {
      id: party.id,
      name: party.id in nameOverrides ? nameOverrides[party.id] : party.full,
      percentVoteWon: party.elections.ge15.votes_pc,
      percentSeatsWon: party.elections.ge15.seats_pc_so_far,
      colour: party.colour
    };

  });

  var sorted = _.sortByOrder(parties, ['percentVoteWon'], [false]);
  var other = _.remove(sorted, {id: 'other'})[0];
  var others = sorted.splice(6, Infinity);

  others.reduce(function(o, p){
    o.percentVoteWon += p.percentVoteWon;
    o.percentSeatsWon += p.percentSeatsWon;
    return o;
  }, other);

  sorted.push(other);

  expires = Date.now() + age;

  last = Promise.resolve({
    headline: 'Popular vote vs. seats won',
    parties: sorted,
  });

  return last;
};
