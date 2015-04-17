'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const speakingurl = require('speakingurl');
const dsv = require('dsv');
const parties = require('uk-political-parties');
const model = require('../model');

module.exports = {
  makeDataFromSources: makeDataFromSources,
  addCollection: addCollection,
  load: load
};

function load(db) {
  return addCollection(db, makeDataFromSources());
}

function makeDataFromSources() {

  // read in the basic Seat data
  var seatsRows = csv.parse(fs.readFileSync(path.resolve(__dirname, '../source/seats.csv')).toString());

  // fold in data from other sources
  var seats = seatsRows.map(slug)
                .map(seatGroups())
                .map(centroid('../source/coordinates.tsv'))
                .map(pressAssociation('../source/ONS-PA-xref.csv'))
                .map(cartogram('../source/cartogram.csv'))
                .map(mySociety('../source/ONS-MySociety-xref.csv'))
                .map(lastResults());

  return _.sortBy(seats, 'name');
}

function addCollection(database, data) {
  var collectionName = 'seats';
  var indexs = ['id', 'name', 'slug', 'pa_id', 'pa_name', 'mysociety_id'];
  return database.addCollection(collectionName, indexs).insert(data);
}

function slug(seat) {
  seat.slug = speakingurl(seat.name);
  return seat;
}

function seatGroups() {
  return function(seat) {
    seat.groups = [];
    return seat;
  };
}

function centroid(filename) {

  var rows = readTSVSourceSync(filename);
  var index = _.indexBy(rows, 'id');

  return function (seat) {
    var row = index[seat.id];

    if (!row) {
      throw new Error('Missing coord for seat ' + seat.id);
    }

    if (!row.lat || !row.lon) {
      throw new Error('Missing lat or long for seat ' + seat.id);
    }

    seat.geo = seat.geo || {};
    seat.geo.centroid = { lat: Number(row.lat), long: Number(row.lon) };
    return seat;
  };
}

function pressAssociation(filename) {
  var rows = readCSVSourceSync(filename);
  var index = _.indexBy(rows, 'ons_id');
  return function(seat) {
    var row = index[seat.id];
    if (!row) {
      throw new Error('Error looking up PA details for ONS ID:' + seat.id);
    }
    seat.pa_id = row.pa_id;
    seat.pa_name = row.pa_name;
    return seat;
  };
}

function cartogram(filename) {
  var rows = readCSVSourceSync(filename);
  var index = _.indexBy(rows, 'id');
  return function(seat) {
    var row = index[seat.id];
    if (!row) {
      throw new Error('Error looking cartogram coord for ONS ID:' + seat.id);
    }
    seat.geo = seat.geo || {};
    seat.geo.cartogram = {
      x: parseInt(row.x),
      y: parseInt(row.y)
    };
    return seat;
  };
}

function mySociety(filename) {
  var rows = readCSVSourceSync(filename);
  var index = _.indexBy(rows, 'ons_id');
  return function(seat) {
    var row = index[seat.id];
    if (!row) {
      throw new Error('Missing MySociety info for ONS ID: ' + seat.id);
    }
    seat.mysociety_id = row.mysociety_id;
    seat.mysociety_unit_id = row.mysociety_unit_id;
    return seat;
  };
}

function lastResults() {

  var rowsGB = readTSVSourceSync('../source/resultsNowGB.tsv');
  var indexGB = _.indexBy(rowsGB, 'id');
  var rowsNI = readTSVSourceSync('../source/resultsNowNI.tsv');
  var indexNI = _.indexBy(rowsNI, 'id');

  return function(seat) {

    var row = indexGB[seat.id];

    if (!row) {
      row = indexNI[seat.id];
    }

    if (!row) {
      throw new Error('Missing result ' + seat.id);
    }

    if (!row.votes) {
      console.error('No turnout', seat.id);
    }

    if (!row.electorate) {
      console.error('No electorate', seat.id);
    }

    if (!row.winner) {
      console.error('No winner', seat.id);
    }


/*

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

*/
    seat.elections = {};
    seat.elections.last = model.factory.SeatElectionResult({
      turnout: row.votes,
      electorate: row.electorate
    });
    seat.elections.last.winner.party = row.winner ? row.winner.toLowerCase() : null;
    var previousParty = seat.party_previous ? seat.party_previous.toLowerCase() : null;
    seat.elections.last.change = seat.elections.last.winner.party !== previousParty;

    seat.elections.ge15_projection = model.factory.SeatElectionResult();
    seat.elections.ge15_projection.source.type = model.Types.FORECAST;

    seat.elections.ge15 = model.factory.SeatElectionResult();
    seat.elections.ge15.source.type = model.Types.NOT_CALLED;

    var knowPartiesTotals = {
      votes: 0,
      votes_pc: 0
    };

    var winner = {
      votes: 0,
      party: ''
    };

    ['Lab', 'C', 'LD', 'Green', 'UKIP',
    'SNP', 'DUP', 'SF', 'PC', 'Alliance',
    'SDLP', 'Speaker', 'ind', 'BNP', 'Respect',
    'APNI','Ind1', 'Ind2', 'TUV', 'UCUNF'].forEach(function(party) {

      if (row[party]) {

        var partyCode = party.toLowerCase();
        var isOther = !parties.isKnownParty(partyCode);
        var electionResult = {
          party: isOther ? 'other' : partyCode,
          votes: Number(row[party]),
        };

        electionResult.votes_pc = roundDp(electionResult.votes / seat.elections.last.turnout * 100, 2);

        if (isOther) {
          electionResult.otherPartyName = party;
        } else {
          knowPartiesTotals.votes += electionResult.votes;
          knowPartiesTotals.votes_pc += electionResult.votes_pc;
        }

        if (electionResult.votes > winner.votes) {
          winner = electionResult;
        }
        seat.elections.last.results.push(electionResult);
      }

    });

    if (winner.party) {
      winner.winner = true;
      seat.elections.last.winner = winner;
    }

    seat.elections.last.others = {
      votes: seat.elections.last.turnout - knowPartiesTotals.votes,
      votes_pc: roundDp(100 - knowPartiesTotals.votes_pc, 2)
    };

    return seat;
  };
}

function roundDp(num, dp) {
  var ex = Math.pow(10, dp);
  return Math.round(num * ex) / ex;
}

const tsv = dsv('\t');

function readTSVSourceSync(filename) {
  return tsv.parse(fs.readFileSync(path.resolve(__dirname, filename)).toString());
}

const csv = dsv(',');

function readCSVSourceSync(filename) {
  return csv.parse(fs.readFileSync(path.resolve(__dirname, filename)).toString());
}
