'use strict';

const Types = exports.Types = {
  PREVIOUS: -2,
  FORECAST: -1,
  NOT_CALLED: 0,
  RUSH: 1,
  RESULT: 2,
  RECOUNT: 3
};

var f = exports.factory = {

  SeatResultDataSource: function(file, type, time, message) {
    return {
      type: type,
      message: message || '',
      filename: file.name,
      revision: file.revision,
      declarationTime: time || null
    };
  },

  SeatPartyResult: function (o) {
    o = o || {};
    var d = {
      party: o.party || null,
      person: o.person || null,
      votes: o.votes || 0,
      votes_pc: o.votes_pc || 0,
      winner: o.winner || false,
      loser: o.loser || false,
      person_of_note: o.person_of_note || false // String.. reason why they are notable
    };

    if (o.majority) {
      d.majority = Number(o.majority);
      d.majority_pc = Number(o.majority_pc);
    }

    return d;
  },

  SeatElectionResult: function (o) {

    o = o || {};

    var d = {
      articles: o.articles || [],
      turnout: o.turnout ? Number(o.turnout) : null,
      turnout_pc: o.turnout_pc ? Number(o.turnout_pc) : null,
      turnout_pc_change: o.turnout_pc_change ? Number(o.turnout_pc_change) : null,
      electorate: o.electorate ? Number(o.electorate) : null,
      change: typeof o.change === 'boolean' ? o.change : false,
      winner: o.winner || f.SeatPartyResult(),
      others: o.others || {votes: 0, votes_pc: 0},
      results: o.results || [],
      source: o.source || f.SeatResultDataSource({name: null, revision: 0}, Types.NOT_CALLED)
    };

    if (d.turnout && d.electorate && !d.turnout_pc) {
      d.turnout_pc = roundDp(d.turnout / d.electorate * 100, 2);
    }

    return d;
  },

  PartyNationalResult: function(o, electorateSize) {
    o = o || {};

    var d = {
      votes: Number(o.votes) || 0,
      votes_pc: Number(o.votes_pc) || 0,
      seats: Number(o.seats) || 0,
      seats_change: Number(o.seats_change) || 0,
      seats_gain: Number(o.seats_gain) || 0,
      seats_loss: Number(o.seats_loss) || 0
    };

    d.seats_pc = d.seats / 6.5;

    if (!d.votes_pc && electorateSize) {
      d.votes_pc = d.votes / 100;
    }

    return d;
  },

  PartyNationalProjection: function(o, electorateSize) {
    o = o || {};
    var d = f.PartyNationalResult(o, electorateSize);
    d.seats_lo = Number(o.seats_lo) || 0;
    d.seats_hi = Number(o.seats_hi) || 0;
    d.pa_forecast = Number(o.pa_forecast) || 0;
    return d;
  },

  Party: function(o) {

    o = o || {};

    var d = {
      id: o.id || null,
      full: o.full || null,
      pa: o.pa || null,
      class: o.class || null,
      populous: o.populous || null,
      colour: o.colour || null,
      secondary_colour: o.secondaryColour || null,
      election_forecast: o.electionForecast || null,
      elections: {}
    };

    var e = d.elections;

    e.last = f.PartyNationalResult();
    e.ge15_projection = f.PartyNationalProjection();
    e.ge15 = f.PartyNationalResult();

    return d;
  }
};

function roundDp(num, dp) {
  var ex = Math.pow(10, dp);
  return Math.round(num * ex) / ex;
}
