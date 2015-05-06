'use strict';

const db = require('./db');
const _ = require('lodash');

module.exports = function(options) {

  options = options || {};

  var has_filter = options.filter_parties && options.filter_parties.length;

  var all_parties = db.parties().find().map(create_party_digest);

  var counts = get_counts(all_parties);

  var filtered_parties;

  if (!has_filter) {
    filtered_parties = all_parties;
  } else {

    var partition = partition_parties(all_parties, options.filter_parties);
    var others = partition[0];
    filtered_parties = partition[0];

    if (options.rollup_others) {
      filtered_parties.push(others.reduce(reduce_others, _.remove(others, {id: 'other'})[0]));
    }

  }

  return {
    counts: counts,
    parties: _.sortByOrder(filtered_parties, ['seats', 'votes'], [false, false])
  };

};

function get_counts(parties) {
  return parties.reduce(function(c, p) {
    c.seats += (p.seats || 0);
    c.votes += (p.votes || 0);
    c.last_vote += (p.last_votes || 0);
    return c;
  }, {seats: 0,votes: 0, last_vote: 0});
}

function partition_parties(parties, filter) {
  var lookup = _.zipObject(filter, _.fill(new Array(parties.length), true));
  return _.partition(parties, function(p) {
    return !!lookup[p.id];
  });
}

function reduce_others(others, party) {
  others.votes += party.votes || 0;
  others.votes_pc += party.votes_pc || 0;
  others.seats += party.seats || 0;
  others.seats_pc += party.seats_pc || 0;
  others.seats_pc_so_far += party.seats_pc_so_far || 0;
  others.seats_change += party.seats_change || 0;
  others.seats_gain += party.seats_gain || 0;
  others.seats_loss += party.seats_loss || 0;
  others.pa_forecast += party.pa_forecast || 0;
  others.ef_seats += party.ef_seats || 0;
  others.ef_seats_change += party.ef_seats_change || 0;
  others.ef_seats_pc += party.ef_seats_pc || 0;
  others.ef_seats_lo += party.ef_seats_lo || 0;
  others.ef_seats_hi += party.ef_seats_hi || 0;
  others.last_votes += party.last_votes || 0;
  others.last_votes_pc += party.last_votes_pc || 0;
  others.last_seats += party.last_seats || 0;
  others.last_seats_pc += party.last_seats_pc || 0;
  return others;
}


function create_party_digest(party) {

  var o = {
    id: party.id,
    full: party.full,
    pa: party.pa,
    colour: party.colour,
    secondary_colour: party.secondary_colour,
    votes: party.elections.ge15.votes,
    votes_pc: party.elections.ge15.votes_pc,
    seats: party.elections.ge15.seats,
    seats_pc: party.elections.ge15.seats_pc,
    seats_pc_so_far: party.elections.ge15.seats_pc_so_far,
    votes_vs_seats: party.elections.ge15.seats_pc_so_far - party.elections.ge15.votes_pc,
    seats_change: party.elections.ge15.seats_change,
    seats_gain: party.elections.ge15.seats_gain,
    seats_loss: party.elections.ge15.seats_loss,
    pa_forecast: party.elections.ge15.pa_forecast,
    ef_seats: party.elections.ge15_projection.seats,
    ef_seats_change: party.elections.ge15_projection.seats_change,
    ef_seats_pc: party.elections.ge15_projection.seats_pc,
    ef_seats_lo: party.elections.ge15_projection.seats_lo,
    ef_seats_hi: party.elections.ge15_projection.seats_hi,
    last_votes: party.elections.last.votes,
    last_votes_pc: party.elections.last.votes_pc,
    last_seats: party.elections.last.seats,
    last_seats_pc: party.elections.last.seats_pc
  };

  return o;
}
