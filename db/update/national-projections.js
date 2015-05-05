'use strict';

const debug = require('debug')('db-update:nation-proj');
const db = require('../loki');

const _ = require('lodash');
const politicalParties = require('uk-political-parties');
const r = require('request-promise');

const d3 = require('d3');
const tsv = _.ary(d3.tsv.parse.bind(d3), 1);
const reqOpts = {
  uri: 'http://interactive.ftdata.co.uk/data/electionforecast-co-uk/tsv/seats-latest.tsv',
  transform:tsv
};

var maxAge = 1000 * 30;
var fetching = false;
var expires = 0;

module.exports = update;

function update(cb) {
  debug('call');

  cb = cb || function(){};

  if (!isStale()) {
    debug('cache not stale yet');
    cb();
    return;
  }

  start();

  debug('Get data from the IG server');

  r(reqOpts).then(processRows).catch(fail).then(cb);
}

function processRows(data) {

  debug('Got ' + data.length + ' rows of data');

  var parties = db.getCollection('parties');

  var updatedParties = data.map(function(d) {
    var id = politicalParties.electionForecastToCode(d.Party);
    var party = parties.findOne({id: id});
    party.elections.ge15_projection.seats = Number(d.Seats);
    party.elections.ge15_projection.seats_pc = Number(d.Seats) / 6.5;

    // TODO: electionforecast.co.uk Swing column doesn't seem to be right
    //       what does it mean?
    party.elections.ge15_projection.seats_change = Number(d.Swing);
    party.elections.ge15_projection.seats_lo = Number(d.Lo);
    party.elections.ge15_projection.seats_hi = Number(d.Hi);

    // TODO: calculate seats_gain, seats_loss from seat projections

    //TODO: is there a way update all in one go
    return party;
  });

  parties.update(updatedParties);

  debug('Parties updated with GE15 national projections');

  done();

  return parties.find();
}

function done() {
  debug('done');
  fetching = false;
  expires = Date.now() + maxAge;
}

function start() {
  debug('start');
  fetching = true;
}

function fail(err) {
  debug(err);
  fetching = false;
  expires = Date.now();
}

function isStale() {
  return !(Date.now() < expires || fetching);
}
