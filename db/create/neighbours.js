'use strict'

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const dsv = require('dsv');
const csv = dsv(',');

module.exports = {
  addCollection: addCollection,
  makeDataFromSources: makeDataFromSources,
  load: load
};

function splitNeighbours(d) {
  d.neighbours = d.neighbours.split(' ');
  return d;
}

function makeDataFromSources() {
  var rows = csv.parse(fs.readFileSync(path.resolve(__dirname, '../source/neighbours.csv')).toString());

  if (rows.length !== 650) {
    throw new Error('Some seats not present. Expect 650, found ' + rows.length);
  }

  return _.uniq(rows.map(splitNeighbours));
}

function load(db) {
  return addCollection(db, makeDataFromSources());
}

function addCollection(database, data) {
  return database.addCollection('neighbours', ['id']).insert(data);
}
