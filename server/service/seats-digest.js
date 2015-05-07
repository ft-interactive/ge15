'use strict';

const db = require('./db');
const _ = require('lodash');
const Types = require('../../db/model/types');

module.exports = function(options) {

  options = options || {};

  var rushes = 0;
  var results = 0;
  var recounts = 0;

  var seats = db.seats().find().map(function(seat) {

    var source = seat.elections.ge15.source;

    if (source) {
      if (source.type === Types.RESULT) {
        results++;
      } else if (source.type === Types.RUSH) {
        rushes++;
      } else if (source.type === Types.RECOUNT) {
        recounts++;
      }
    }

    var loser = {};

    if (seat.elections.ge15.change) {
      loser = _.find(seat.elections.ge15.results, 'loser', true) || {};
    }

    var winner = seat.elections.ge15.winner || {};
    var declaration_time = seat.elections.ge15.source &&
                                seat.elections.ge15.source.declaration_time ?
                                new Date(seat.elections.ge15.source.declaration_time) : '';

    if (declaration_time) {
      declaration_time = declaration_time.toLocaleTimeString();
    }

    var o = {
      id: seat.id,
      name: seat.name,
      type: source.type,
      change: seat.elections.ge15.change,
      winner_party: winner.party,
      winner_votes: winner.votes,
      winner_votes_pc: winner.votes_pc,
      winner_majority: winner.majority,
      winner_majority_pc: winner.majority_pc,
      winner_person: winner.person,
      winner_notable: winner.person_of_note,
      loser_party: loser.party || null,
      loser_person: loser.person || null,
      loser_votes: loser.votes || null,
      loser_votes_pc: loser.votes_pc || null,
      loser_notable: !!loser.person_of_note,
      turnout: seat.elections.ge15.turnout,
      turnout_pc: seat.elections.ge15.turnout_pc,
      turnout_pc_change: seat.elections.ge15.turnout_pc_change,
      electorate: seat.elections.ge15.electorate,
      declaration_time: declaration_time,
      cartogram_x: seat.geo.cartogram.x,
      cartogram_y: seat.geo.cartogram.y,
      pa_id: seat.pa_id,
      mysociety_id: seat.pa_id,
      region_id: seat.region_id,
      region_name: seat.region_name,
      previous_winner_votes: seat.elections.last.winner.votes,
      previous_winner_votes_pc: seat.elections.last.winner.votes_pc,
      previous_turnout: seat.elections.last.turnout,
      previous_turnout_pc: seat.elections.last.turnout_pc,
      previous_electorate: seat.elections.last.electorate
    };

    if (options.show_main_parties) {

      var ge15 = {
        c: _.find(seat.elections.ge15.results, 'party', 'c'),
        lab: _.find(seat.elections.ge15.results, 'party', 'lab'),
      };

      ge15.other = {votes: 0, votes_pc: 0};

      seat.elections.ge15.results.reduce(function(o, result){
        if (result.party !== 'c' && result.party !== 'lab') {
          o.votes += result.votes;
          o.votes_pc += result.votes_pc;
        }
        return o;
      }, ge15.other);

      o.c_votes = !ge15.c ? 0 : ge15.c.votes;
      o.c_votes_pc = !ge15.c ? 0 : ge15.c.votes_pc;
      o.lab_votes = !ge15.lab ? 0 : ge15.lab.votes;
      o.lab_votes_pc = !ge15.lab ? 0 : ge15.lab.votes_pc;
      o.other_votes = ge15.other.votes;
      o.other_votes_pc = ge15.other.votes_pc;

      var previous = {
        c: _.find(seat.elections.last.results, 'party', 'c'),
        lab: _.find(seat.elections.last.results, 'party', 'lab'),
      };

      previous.other = {votes: 0, votes_pc: 0};

      seat.elections.last.results.reduce(function(o, result){
        if (result.party !== 'c' && result.party !== 'lab') {
          o.votes += result.votes;
          o.votes_pc += result.votes_pc;
        }
        return o;
      }, previous.other);

      o.c_votes_prev = !previous.c ? 0 : previous.c.votes;
      o.c_votes_pc_prev = !previous.c ? 0 : previous.c.votes_pc;
      o.lab_votes_prev = !previous.lab ? 0 : previous.lab.votes;
      o.lab_votes_pc_prev = !previous.lab ? 0 : previous.lab.votes_pc;
      o.other_votes_prev = previous.other.votes;
      o.other_votes_pc_prev = previous.other.votes_pc;
    }

    return o;

  });

  return {
    rush_count: rushes,
    result_count: results,
    recount_count: recounts,
    seats: seats
  };
};
