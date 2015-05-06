'use strict';

const debug = require('debug')('model-pa');
const _ = require('lodash');
const PoliticalParties = require('uk-political-parties');
const xml2js = require('xml2js').parseString;

const db = require('../loki');
const model = require('./index.js');
const f = model.factory;
const Types = require('./types');

exports.SOP_xml_to_PartyNationalResults = function(file, xml) {

  var parties = xml.FirstPastThePostStateOfParties.Parties[0].Party;
  var sop = xml.FirstPastThePostStateOfParties.$;
  var seats_so_far = Number(sop.numberOfResults) || 0;
  var total_seats_available = Number(sop.totalNumberOfConstituencies) || 650;
  var votes_so_far = Number(sop.totalVotes) || 0;

  /*
  TODO: how do we get the size of the turnout? is it the vote size after 650 seats?
  TODO: do we want to use the party's %-change field in any way? <Party percentageChange="+21.58">
  TODO: how do we get seats_change and seats_change_pc? is this only relevant at the end of the night?
  TODO: we need a place in the DB to store high level numbers like turnout and electorate size.
  TODO: might be useful to make a special table of gains an losses for each party
  */
  var others = {};
  others.id = 'other',
  others.election = f.PartyNationalResult({revision: file.revision});
  others.election.other_parties = [];

  var results = parties.reduce(function(result, node) {
    var party = node.$;
    var code = PoliticalParties.paToCode(party.abbreviation);

    var o = {
      pa_number: party.paId,
      election: f.PartyNationalResult({
        votes: party.totalVotes,
        votes_pc: party.percentageShare,
        seats: party.totalSeats,
        seats_pc_so_far: Number(party.totalSeats) / (seats_so_far / 100),
        seats_gain: party.gains,
        seats_loss: party.losses,
        pa_forecast: party.forecastSeats ? Number(party.forecastSeats) : null,
        revision: file.revision
      })
    };

    // Once the last results are called, the PA stop sending a
    // forecast. Fill in the missing data here for anything
    // still needing the forecast.
    if (seats_so_far >= total_seats_available && !o.election.pa_forecast) {
      o.election.pa_forecast = o.election.seats;
    }

    if (PoliticalParties.isKnownParty(code)) {
      o.id = code;
      result.push(o);
    } else {
      o.id = 'other';
      o.election.other_party_name = party.name;

      // for reference, keep are record of all the parties that come under 'other'
      others.election.other_parties.push(o);

      // aggregate the numbers for all the other parties
      others.election.votes += o.election.votes;
      others.election.votes_pc += o.election.votes_pc;
      others.election.seats += o.election.seats;
      others.election.seats_pc += o.election.seats_pc;
      others.election.seats_pc_so_far += o.election.seats_pc_so_far;
      others.election.seats_gain += o.election.seats_gain;
      others.election.seats_loss += o.election.seats_loss;
      others.election.seats_net_gain += o.election.seats_net_gain;
      others.election.pa_forecast += o.election.pa_forecast;
    }
    return result;
  }, []);

  // We don't need so much data for all the 'other' parties.
  others.election.other_parties = others.election.other_parties.map(function(p) {
    return {
      pa_number: p.pa_number,
      name: p.election.other_party_name,
      seats: p.election.seats,
      votes: p.election.votes,
      votes_pc: p.election.votes_pc
    };
  });

  results.push(others);

  // TODO: what we going to do with all the other data?
  return {
    parties: results,
    votes_so_far: votes_so_far,
    seats_so_far: seats_so_far,
    pa_forecast_majority: sop.forecastMajority ? Number(sop.forecastMajority) : null,
    source: {
      message: sop.forecastWinningParty || '',
      note: sop.note || '',
      filename: file.name,
      revision: file.revision,
    }
  };

};

exports.update_party_results = function(file, xml, callback) {

  xml2js(xml, function(parseErr, result) {
    if (parseErr) {
      callback(parseErr);
      return;
    }

    var o = exports.SOP_xml_to_PartyNationalResults(file, result);
    var updating = o.parties.map(function(party) {

      var existing = db.getCollection('parties').findOne({id: party.id});

      if (!existing) {
        console.error('SOP has unknown party');
        return existing;
      }

      var existingElection = existing.elections.ge15;
      var election = party.election;
      var can_update = election.revision > existingElection.revision;

      if (can_update) {
        existingElection.votes = election.votes;
        existingElection.votes_pc = election.votes_pc;
        existingElection.seats = election.seats,
        existingElection.seats_pc = election.seats_pc;
        existingElection.seats_pc_so_far = election.seats_pc_so_far;
        existingElection.seats_gain = election.seats_gain;
        existingElection.seats_loss = election.seats_loss;
        existingElection.seats_net_gain = election.seats_net_gain;
        existingElection.pa_forecast = election.pa_forecast || existingElection.pa_forecast;
        existingElection.revision = election.revision;
        if (election.other_parties) {
          existingElection.other_parties = election.other_parties;
        }
        existingElection.seats_change = existingElection.seats - existing.elections.last.seats;
        existingElection.seats_change_pc = existingElection.seats_pc - existing.elections.last.seats_pc;
      }

      return existing;
    });

    db.getCollection('parties').update(updating);

    // TODO: this is where we would update the db with high level stats for the whole GE

    callback();
  });
};

exports.update_seat_result = function(file, xml, callback) {


  xml2js(xml, function(parseErr, result) {
    if (parseErr) {
      debug('parse err');
      callback(parseErr);
      return;
    }

    var pa_id;
    var type;

    if (file.type === Types.RECOUNT) {
      type = Types.RECOUNT;
      pa_id = result.Recount.Election[0].Constituency[0].$.number;
    } else if (file.type === Types.RUSH) {
      pa_id = result.FirstPastThePostRush.Election[0].Constituency[0].$.number;
      type = Types.RUSH;
    } else if (file.type === Types.RESULT) {
      pa_id = result.FirstPastThePostResult.Election[0].Constituency[0].$.number;
      type = Types.RESULT;
    }

    if (!type) {
      callback(new Error('File type is not recognised'));
      return;
    }

    if (!pa_id) {
      callback(new Error('XML does not have a PA Seat ID'));
      return;
    }

    debug('Find seat data for pa_id=' + pa_id);

    var collection = db.getCollection('seats');
    var seat = collection.findOne({pa_id: pa_id});

    if (!seat) {
      callback(new Error('Cannot find PA Seat ID ' + pa_id + ' in the DB'));
      return;
    }

    var message_context = '. type=' + type + ' file=' + file.name + ' revision=' + file.revision + ' id=' + seat.id + ' name=' + seat.name + ' pa_id=' + pa_id;

    debug('Process type=' + type + message_context);

    if (type === Types.RECOUNT) {
      // TODO: proper recount implementation
      seat.elections.ge15.recount = true;
      collection.update(seat);
      callback();
      return;
    }

    var existing_type = seat.elections.ge15.source && typeof seat.elections.ge15.source.type === 'number' ? seat.elections.ge15.source.type : Types.NOT_CALLED;
    var existing_revision = seat.elections.ge15.source && typeof seat.elections.ge15.source.revision === 'number' ? seat.elections.ge15.source.revision : 0;

    message_context += ' current=(type:' + existing_type + ',revision:' + existing_revision + ')';

    // We only want to think about cancelling the update
    // if we already have results data
    if (existing_type > Types.NOT_CALLED) {

      if (type === Types.RUSH) {

        if (existing_type === Types.RESULT && existing_revision > file.revision) {
          debug('Dont update rush, already have result' + message_context);
          callback();
          return;
        }

        if (existing_revision >= file.revision) {
          debug('Dont update rush, later revision (or correction) already received' + message_context);
          callback();
          return;
        }

      } else if (type === Types.RESULT) {

        if (existing_type === Types.RESULT && existing_revision >= file.revision) {
          debug('Dont update result, later revision already received'  + message_context);
          callback();
          return;
        }

      } else {
        callback(new Error('This should not happen'));
        return;
      }
    }

    debug('Adding ' + (type === Types.RESULT ? 'result' : 'rush') + ' data.'  + message_context);

    // create a new election object the reflect what's
    // contained in the new XML from the PA feed.
    var data = exports.seat_xml_to_result(type, file, result);

    // apply all the new data to the seat object
    seat.elections.ge15 = data;

    // update the object
    collection.update(seat);

// console.dir(seat);
// console.dir(seat.elections.ge15);
    callback();

  });
};

function candidateXMLtoSeatPartyResult(node) {

  var pa_party_abbrv = party.abbreviation.toLowerCase();
  // handle Scottish Labour candidates that style themselves as Labout Co-op
  if (pa_party_abbrv === 'lab co-op') {
    party.abbreviation = PoliticalParties.data.lab.id;
  } else if (pa_party_abbrv === 'the speaker' || pa_party_abbrv === 'speaker') {
    party.abbreviation = PoliticalParties.data.c.id;
  }

  var candidate = node.$;
  var party = node.Party[0].$;
  var code = PoliticalParties.paToCode(party.abbreviation);
  var o = f.SeatPartyResult({
    person: candidate.firstName + ' ' + candidate.surname,
    winner: candidate.elected === '*',
    loser: false,
    votes: Number(party.votes),
    votes_pc: Number(party.percentageShare)
  });

  if (!o.winner && candidate.previousSittingMember === '*') {
    o.loser = candidate.previousSittingMember === '*';
  }

  // TODO: add "person_of_note_field"
  //       by combining some bertha data and PA data

  if (PoliticalParties.isKnownParty(code)) {
    o.party = code;
  } else {
    o.party = 'other';
    o.other_party_name = party.name;
  }
  return o;
}

exports.seat_xml_to_result = function(type, file, xml) {
  var node_name;

  if (type === Types.RUSH) {
    node_name = 'FirstPastThePostRush';
  } else if (type === Types.RESULT){
    node_name = 'FirstPastThePostResult';
  } else {
    throw new Error('Cannot convert type ' + type);
  }
  var node = xml[node_name];

  if (!node) {
    throw new Error('Cannot find node ' + node_name);
  }

  var constituency = node.Election[0].Constituency[0].$;
  var declation_time = node.$.declarationTime ? new Date(node.$.declarationTime) : null;
  var candidates = node.Election[0].Constituency[0].Candidate;

  var data = f.SeatElectionResult({
    turnout: constituency.turnout,
    turnout_pc: constituency.percentageTurnout,
    turnout_pc_change: constituency.percentageChangeTurnout,
    electorate: constituency.electorate,
    change: !!constituency.gainOrHold ? constituency.gainOrHold.toLowerCase() !== 'hold' : false,
  });

  data.source = f.SeatResultDataSource(file, type, declation_time, constituency.paStyleMessageText || '');
  data.results = candidates.map(candidateXMLtoSeatPartyResult);

  var winnerIndex = _.findIndex(data.results, 'winner');
  var winner = winnerIndex !== -1 ? data.results[winnerIndex] : null;

  if (winner) {
    winner.majority = constituency.majority ? Number(constituency.majority) : null;
    winner.majority_pc = constituency.percentageMajority ? Number(constituency.percentageMajority) : null;
    data.winner = winner;
  } else {
    data.winner = f.SeatPartyResult();
  }

  data.others = data.results.reduce(function(others, result) {
    if (result.votes && result.party === 'other') {
      others.votes += result.votes;
      others.votes_pc += result.votes_pc;
    }
    return others;
  }, {votes: 0, votes_pc: 0});

  return data;
};
