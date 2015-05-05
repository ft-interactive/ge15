'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const PoliticalParties = require('uk-political-parties');
const knownParties = _.values(PoliticalParties.data);
const dsv = require('dsv');
const csv = dsv(',');
const model = require('../model');

module.exports = {
  addCollection: addCollection,
  makeDataFromSources: makeDataFromSources,
  load: load
};

function load(db) {
  return addCollection(db, makeDataFromSources());
}

function createModel(p) {
  return model.factory.Party(p);
}

function historicalElectionResults(filename) {

  var history = csv.parse(fs.readFileSync(path.resolve(__dirname, '../source/parties-history.csv')).toString());
  var index = _.indexBy(history, 'id');

  return function(party) {

    var party_history = index[party.id];

    party.elections.last = model.factory.PartyNationalResult({
      seats: party_history ? party_history.last_seats : 0
    });

    return party;
  };
}

function makeDataFromSources() {

  var parties = knownParties.map(createModel)
                            .map(historicalElectionResults());

  return parties;
}

function addCollection(database, data) {
  return database.addCollection('parties', ['id', 'short', 'full', 'pa']).insert(data);
}
