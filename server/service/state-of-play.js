'use strict';

const ukParties = require('uk-political-parties');
const _ = require('lodash');
const db = require('./db');
const order_of_appearance = ['c', 'lab', 'snp', 'ld', 'ukip', 'dup', 'pc', 'green'];

var expires;
var last;
var age = 1000 * 10;

module.exports = function (howMany) {

  if (last && expires && Date.now() < expires) {
    return last;
  }

  var selected_parties = order_of_appearance.slice(0, Math.max(howMany - 1, 0));

  var sopParties = selected_parties.map(create_party);

  // var other =
  // sopParties.push(create_party('other'))

  var gains_and_losses = selected_parties.reduce(function(o, id){
    o[id] = {
      gains: [],
      losses: []
    };
    return o;
  },{});

  db.seats().find().forEach(function(seat) {
    if (!seat.elections.ge15.change) return;
    var winner = seat.elections.ge15.winner;
    var loser = seat.elections.last.winner;

    // FIXME: what!? wont this break when we throw others into the mix
    if (winner.party in gains_and_losses) {
      gains_and_losses[winner.party].gains.push({
        nowColour: ukParties.colour(winner.party),
        wasColour: ukParties.colour(loser.party),
        tooltip: seat.name,
        was: loser.party,
        now: winner.party
      });
    }

    // FIXME: what!?  wont this break when we throw others into the mix
    if (loser.party in gains_and_losses) {
      gains_and_losses[loser.party].losses.push({
        nowColour: ukParties.colour(winner.party),
        wasColour: ukParties.colour(loser.party),
        tooltip: seat.name,
        was: loser.party,
        now: winner.party
      });
    }
  });


  sopParties.forEach(function(party) {
    party.gains = gains_and_losses[party.id].gains;
    party.losses = gains_and_losses[party.id].losses;
  });

  // TODO: folder in the others into the other.

  // TODO: number of seats declared

  // TODO: gains and loss
  /* gains and losses arrays need to be filled with these

  {
    party: p.party,
    colour: ukParties.colour(p.party),
    from: p.resultnow,
    to : p.resultprediction
  }

  */

  // TODO: should we get the updated date from the PA data somehow?

  // TODO: check that net change (for each party) is working


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

  expires = Date.now() + age;

  last = Promise.resolve({
    parties: sopParties,
    headline: 'State of play',
    numSeatsDeclared: 134,
    updated: new Date()
  });

  return last;

};

function create_party(id) {
  var party = db.parties().findOne({id: id});
  return {
    id: party.id,
    colour: party.colour,
    secondaryColour: party.secondary_colour,
    totalWon: party.elections.ge15.seats,
    gains: [],
    losses: []
  };
}
