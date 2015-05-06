'use strict';

const ukParties = require('uk-political-parties');
const _ = require('lodash');
const db = require('./db');
const paResultTypes = require('../../db/model/types');
const order_of_appearance = ['c', 'lab', 'snp', 'ld', 'ukip', 'dup', 'pc', 'green'];

var expires = {};
var last = {};
var age = 1000 * 10;

module.exports = function (howMany) {

  if (last[howMany] && expires[howMany] && Date.now() < expires[howMany]) {
    return last[howMany];
  }

  var selected_parties = order_of_appearance.slice(0, Math.max(howMany - 1, 0));


  // number to count up the global total of seats
  var numSeatsDeclared = 0;


  // make an array of parties we're interested in
  var sopParties = selected_parties.map(function (id) {
    var party = db.parties().findOne({id: id});

    numSeatsDeclared += party.elections.ge15.seats;

    return {
      id: party.id,
      label: ukParties.shortName(party.id),
      colour: party.colour,
      secondaryColour: party.secondary_colour,
      totalWon: party.elections.ge15.seats,

      losses: [],
      gains: [],
    };
  });


  // make an extra 'party' object (kept separate for now)
  var othersParty = {
    id: 'xxx',
    label: 'Others',
    colour: ukParties.colour('other'),
    secondaryColour: ukParties.secondaryColour('other'),
    totalWon: db.parties().find()
      .filter(function (party) {
        return selected_parties.indexOf(party.id) === -1;
      }).reduce(function (total, party) {
        return total + party.elections.ge15.seats;
      }, 0),

    losses: [],
    gains: []
  };

  numSeatsDeclared += othersParty.totalWon;


  // go through all the seats and increment the relevant bits and bobs
  db.seats().find().forEach(function (seat) {
    if (seatIsCalled(seat)) {
      // find who lost and who won this seat
      var loserId = seat.elections.last.winner.party;
      var winnerId = seat.elections.ge15.winner.party;

      var loser = _.findWhere(sopParties, {id: loserId}) || othersParty;
      var winner = _.findWhere(sopParties, {id: winnerId}) || othersParty;

      // sanity check
      if (seat.elections.ge15.change !== (loserId !== winnerId)) {
        console.warn(
          'WARNING: seat.elections.ge15.change is ' + seat.elections.ge15.change + ' for "' + seat.name + '"' +
          ' but loserId is ' + loserId + ' and winnerId is ' + winnerId 
        );
      }

      // if this seat has changed hands, add it as a loss to the relevant party
      if (loserId !== winnerId) {
        // nb: we need to use ukParties lookup here, because it might be an 'Other'
        var seatChangeDetails = {
          // loserColour: ukParties.colour(loserId),
          winnerColour: ukParties.colour(winnerId),
          tooltip: seat.name + ' (' + ukParties.shortName(loserId) + ' → ' + ukParties.shortName(winnerId) + ')',
          was: loserId,
          now: winnerId
        };

        loser.losses.push(seatChangeDetails);
        winner.gains.push(seatChangeDetails);
      }
    }
  });


  // add "Others" party to the main array
  sopParties.push(othersParty);


  // TODO: should we get the updated date from the PA data somehow?


  // augment the top 5 with extra bits, and sort their squares
  sopParties.forEach(function (party) {
    party.netChange = party.gains.length - party.losses.length;

    // sort so the little squares are grouped into parties (with biggest group fist)
    var gainerTotals = {};
    party.losses.forEach(function (seat) {
      if (!gainerTotals[seat.now]) gainerTotals[seat.now] = 0;
      gainerTotals[seat.now]++;
    });
    party.losses.sort(function (a, b) {
      if (gainerTotals[b.now] > gainerTotals[a.now]) return 1;
      if (gainerTotals[b.now] < gainerTotals[a.now]) return -1;
      return 0;
    });
  });


  var finalData = {
    parties: sopParties,
    headline: 'State of play',
    numSeatsDeclared: numSeatsDeclared,
    updated: new Date()
  };


  expires[howMany] = Date.now() + age;
  last[howMany] = Promise.resolve(finalData);
  return last[howMany];
};


function seatIsCalled(seat) {
  switch(seat.elections.ge15.source.type) {
    case paResultTypes.RUSH:
    case paResultTypes.RESULT:
      return true;
  }
  return false;
}
