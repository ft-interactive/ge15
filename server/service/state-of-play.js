'use strict';

var ukParties = require('uk-political-parties');
var _ = require('lodash');

var knownParties = [
  'lab', 'c', 'ld', 'green', 'ukip', 'snp', 'dup',
  'sf', 'pc', 'alliance', 'other', 'sdlp', 'uup'
];


module.exports = function (howMany) {
  // return dummy data, plundered from the battlegrounds data for now
  return require('../routers/data/').battlegroundData().then(function (battlegrounds) {

    // make an array of seat results
    var seats = [];
    battlegrounds.forEach(function (battleground) {
      battleground.constituencies.forEach(function (c, i) {
        seats.push({
          id: c.id,
          name: c.name,
          was: c.holdernow,
          now: c.holderpredicted,
          wasColour: ukParties.colour(c.holdernow),
          nowColour: ukParties.colour(c.holderpredicted),
          slopes: c.parties.map(function (p) {
            return {
              party: p.party,
              colour: ukParties.colour(p.party),
              from: p.resultnow,
              to : p.resultprediction
            };
          })
        });
      });
    });
    seats = _.uniq(seats, 'id');



    // organise the seats data into a list of parties, sorted
    var sopParties = knownParties.map(function (party) {
      return {
        id: party,
        colour: ukParties.colour(party),
        secondaryColour: ukParties.secondaryColour(party),
        totalWon: _.where(seats, {now: party}).length,
        gains: seats.filter(function (seat) {
          return seat.was !== party && seat.now === party;
        }),
        losses: seats.filter(function (seat) {
          return seat.was === party && seat.now !== party;
        })
      };
    }).sort(function (a, b) {
      return b.totalWon - a.totalWon;
    });


    // anything beyond the top 4: roll into an "Others" party
    var others = sopParties.slice(howMany - 1);
    sopParties.length = howMany - 1;
    sopParties[howMany - 1] = {
      id: 'other',
      colour: ukParties.colour('other'),
      secondaryColour: ukParties.secondaryColour('other'),
      totalWon: _.pluck(others, 'totalWon')
        .reduce(function (a, b) { return a + b }),
      gains: _.pluck(others, 'gains')
        .reduce(function (a, b) { return a.concat(b) }),
      losses: _.pluck(others, 'losses')
        .reduce(function (a, b) { return a.concat(b) })
    };


    // augment the top 5 with extra bits, and sort their squares
    sopParties.forEach(function (party) {
      party.label = (party.id === 'other') ? 'Other' : ukParties.shortName(party.id);

      party.netChange = party.gains.length - party.losses.length;


      // sort so the little squares are grouped into parties (with biggest group fist)
      var gainedFromParties = {};
      party.gains.forEach(function (seat) {
        if (!gainedFromParties[seat.was]) gainedFromParties[seat.was] = 0;
        gainedFromParties[seat.was]++;
      });
      party.gains.sort(function (a, b) {
        return gainedFromParties[b.was] - gainedFromParties[a.was];
      });

      var lostToParties = {};
      party.losses.forEach(function (seat) {
        if (!lostToParties[seat.now]) lostToParties[seat.now] = 0;
        lostToParties[seat.now]++;
      });
      party.losses.sort(function (a, b) {
        return lostToParties[b.now] - lostToParties[a.now];
      });
    });

    return {
      parties: sopParties,
      headline: 'State of play',
      numSeatsDeclared: 134,
      updated: new Date()
    };
  });
};
