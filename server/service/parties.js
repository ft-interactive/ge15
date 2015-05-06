'use strict';

const db = require('./db');
const _ = require('lodash');

function ge15(party) {
  return party.elections.ge15.seats;
}

function last(party) {
  return party.elections.ge15.seats;
}


module.exports = function(election) {
  //TODO: use a Loki View to do the Sorting.
  return Promise.resolve(_.sortByOrder(db.parties().find(), [ge15, last], [false, false]));
};
