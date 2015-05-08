'use strict';

const db = require('./db');
const filters = require('../util/filters');
const _ = require('lodash');

const customNames = {
  'A': 'Alliance',
  'Grn': 'Greens',
  'Oth': 'Other',
  'SF': 'Sinn Fein'
};

var expires = {};
var last = {};
var age = 1000 * 10;

module.exports = function (seatId) {
  if (last[seatId] && expires[seatId] && Date.now() < expires[seatId]) {
    return last[seatId];
  }

  const ukParties = require('uk-political-parties');
  var data;

  var seat = db.seats().findOne({id: seatId});
  if (seat) {
    // make the results data (if this is called, and not just a rush)
    var finalResults;
    var chartExtent;
    var ge15 = seat.elections.ge15;

    if (ge15.source.type > 1) {
      var results = ge15.results.map(function (result, index) {
        var label = ukParties.shortName(result.party);
        label = customNames[label] || label;

        return {
          partyId: result.party,
          label: label,
          percentage: result.votes_pc
        };
      });

      // console.log('\n\n\nRESULTS', results);

      // select just the top 4
      var NUM_TO_SHOW = 5;
      finalResults = results.slice(0, NUM_TO_SHOW - 1);
      // console.log('\n\n\nLEADERS', finalResults);
      
      // roll up the stragglers
      var stragglers = results.slice(NUM_TO_SHOW);
      // console.log('\n\n\nSTRAGGLERS', stragglers);
      if (stragglers.length) {
        finalResults.push({
          partyId: 'other',
          label: 'Other',
          percentage: stragglers.reduce(function (val, straggler) {
            return val + straggler.percentage;
          }, 0)
        });
      }

      // console.log('\n\n\nFINAL RESULTS', finalResults);

      chartExtent = Math.max.apply(null,_.pluck(finalResults, 'percentage'));
    }

    var turnoutChange;
    if (ge15.turnout_pc_change !== null && ge15.turnout_pc_change !== undefined) {
      turnoutChange = filters.round(ge15.turnout_pc_change, 1);
      turnoutChange = (turnoutChange < 0) ?
        'up ' + (-turnoutChange) :
        'down ' + turnoutChange;
    }

    data = {
      name: seat.name,
      called: ge15.source.type > 0,
      change: ge15.change,
      partyId: ge15.winner.party,
      lastElectionPartyId: seat.elections.last.winner.party,
      winnerName: ge15.winner.person + ' - ' +
        ukParties.fullName(ge15.winner.party),
      turnout: ge15.turnout_pc,
      turnoutChange: turnoutChange,
      results: finalResults,
      chartExtent: chartExtent
    };
  }

  expires[seatId] = Date.now() + age;
  last[seatId] = Promise.resolve(data);
  return last[seatId];
};
