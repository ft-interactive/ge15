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
    var netChange = party.elections.ge15.seats_net_gain;

    return {
      id: party.id,
      label: party.short,
      colour: party.colour,
      secondaryColour: party.secondary_colour,
      totalWon: party.elections.ge15.seats,
      netChange: (
        netChange < 0 ?
          '&minus;&#8202;' + (-netChange) :
          (
            netChange === 0 ?
              '0' :
              '+&#8202;' + netChange
          )
      ),
      losses: [],
      gains: []
    };
  });

  // find all the parties who are not in our selected bunch
  var others = db.parties().find().filter(function (party) {
    return selected_parties.indexOf(party.id) === -1;
  });


  // make an extra 'party' object (kept separate for now)
  var othersParty = {
    id: 'xxx',
    label: 'Others',
    colour: ukParties.colour('other'),
    secondaryColour: ukParties.secondaryColour('other'),
    totalWon: others.reduce(function (total, party) {
        return total + party.elections.ge15.seats;
      }, 0),

    minitable: (function () {
      var customShortNames = {
        'A': 'Alliance',
        'Grn': 'Greens',
        'Oth': 'Other',
        'SF': 'Sinn Fein'
      };
      var minitable = others
        // only parties who have won something
        .filter(function (party) {
          return party.elections.ge15.seats > 0;
        })
        // make the table row objects
        .map(function (party) {
          var shortName = ukParties.shortName(party.id);
          shortName = customShortNames[shortName] || shortName;
          var fullName = ukParties.fullName(party.id);

          return {
            shortName: shortName,
            fullName: fullName,
            numSeats: party.elections.ge15.seats
          };
        })
        // sort by highest number of seats
        .sort(function (a, b) {
          if (a.numSeats > b.numSeats) return -1;
          if (a.numSeats < b.numSeats) return 1;
          return 0;
        });

      // move the 'other' to the end
      var otherRowIndex;
      minitable.forEach(function (row, i) {
        if (row.shortName === 'Other') otherRowIndex = i;
      });
      minitable.push(minitable.splice(otherRowIndex, 1)[0]);

      return minitable;
    })()
  };

  numSeatsDeclared += othersParty.totalWon;

  // go through all the seats and increment the relevant bits and bobs
  db.seats().find().forEach(function (seat) {
    if (seatIsCalled(seat)) {
      // find who lost and who won this seat
      var loserId = seat.elections.last.winner.party;
      var winnerId = seat.elections.ge15.winner.party;

      var loser = _.findWhere(sopParties, {id: loserId});
      var winner = _.findWhere(sopParties, {id: winnerId});

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

        if (loser) loser.losses.push(seatChangeDetails);
        if (winner) winner.gains.push(seatChangeDetails);
      }
    }
  });


  // augment the top 5 with extra bits, and sort their squares
  sopParties.forEach(function (party) {
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

    // party.losses.splice(0, 90); // for seeing how it might really look
  });


  // add "Others" party to the main array
  sopParties.push(othersParty);


  // TODO: should we get the updated date from the PA data somehow?


  var finalData = {
    parties: sopParties,
    headline: 'Final result',
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
