'use strict';

const debug = require('debug')('model-pa');
const _ = require('lodash');
const PoliticalParties = require('uk-political-parties');
const xml2js = require('xml2js').parseString;

const db = require('../');
const model = require('./index.js');
const f = model.factory;
const Types = model.types;


exports.create_result = function(file, xml, callback) {
  xml2js(xml, function(parseErr, result) {
    if (parseErr) {
      callback(parseErr);
      return;
    }

    var pa_id;
    var data;
    var type;

    if (file.isRecount) {
      type = Types.RECOUNT;
      pa_id = result.Recount.Election[0].Constituency[0].$.number;
    } else if (file.isRush) {
      pa_id = result.FirstPastThePostRush.Election[0].Constituency[0].$.number;
      type = Types.RUSH;
    } else if (file.isResult) {
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

    var seat = db.getCollection('seats').findOne({pa_id: pa_id});

    if (!seat) {
      callback(new Error('Cannot find PA Seat ID ' + pa_id + ' in the DB'));
      return;
    }

    debug('Process type=' + type + ' file=' + file.name + ' id=' + seat.id + ' name=' + seat.name + ' pa_id=' + pa_id);

    if (type === Types.RECOUNT) {
      // TODO: proper recount implementation
      seat.elections.ge15.recount = true;
      callback(null, seat);
      return;
    }

    data = exports.xml_to_result(type, file, result);

    if (seat.elections.ge15.source &&
              typeof seat.elections.ge15.source.type === 'number' &&
              seat.elections.ge15.source.type === 2) {
      debug('Dont update rush, already have result. id=' + seat.id + ' name="' + seat.name + '" pa_id=' + pa_id + ' file=' + JSON.stringify(file) + ' source=' + JSON.stringify(dbSeat.elections.ge15.source));
      return;
    }

    if (dbSeat.elections.ge15.source &&
              typeof dbSeat.elections.ge15.source.type === 'number' &&
              dbSeat.elections.ge15.source.type === 1 &&
              typeof dbSeat.elections.ge15.source.revision === 'number' &&
              dbSeat.elections.ge15.source.revision >= file.revision) {
      debug('Dont update rush, later revision already received. id=' + dbSeat.id + ' name="' + dbSeat.name + '" pa_id=' + pa_id + ' file=' + JSON.stringify(file) + ' source=' + JSON.stringify(dbSeat.elections.ge15.source));
      return;
    }

    debug('Adding rush data. id=' + dbSeat.id + ' name="' + dbSeat.name + '" pa_id=' + pa_id + ' file=' + file.name);

    do_update = true;





  });
};

function candidateXMLtoSeatPartyResult(node) {
  var candidate = node.$;
  var party = node.Party[0].$;
  var code = PoliticalParties.paToCode(party.abbreviation);
  var o = f.SeatPartyResult({
    person: candidate.firstName + ' ' + candidate.surname,
    winner: candidate.elected === '*',
    loser: candidate.previousSittingMember === '*',
    votes: Number(party.votes),
    votes_pc: Number(party.percentageShare)
  });

  if (PoliticalParties.isKnownParty(code)) {
    o.party = code;
  } else {
    o.party = 'other';
    o.other_party_name = party.name;
  }
  return o;
}

exports.xml_to_result = function(type, file, xml) {
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
    change: !!constituency.gainOrHold ? constituency.gainOrHold !== 'hold' : false,
  });

  data.source = f.SeatResultDataSource(file, type, declation_time, constituency.paStyleMessageText || '');
  data.results = candidates.map(candidateXMLtoSeatPartyResult);

  var winnerIndex = _.findIndex(data.results, 'winner');
  var winner = winnerIndex !== -1 ? data.results[winnerIndex] : null;

  if (winner) {
    winner.o.majority = constituency.majority ? Number(constituency.majority) : null;
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

  /*
  Do we need to some rounding on votes_pc?

  dbSeat.elections.ge15.others = {
    votes: dbSeat.elections.ge15.turnout - knowPartiesTotals.votes,
    votes_pc: roundDp(100 - knowPartiesTotals.votes_pc, 2)
  };
  */

  return data;
};
