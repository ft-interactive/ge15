'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  makeDataFromSources: makeDataFromSources,
  addCollection: addCollection,
  load: load
};

function load(db) {
  return addCollection(db, makeDataFromSources());
}

function makeDataFromSources() {
  var str = fs.readFileSync(path.resolve(__dirname, '../source/groups.json')).toString();
  var groups = JSON.parse(str);
  return groups;
}

function addCollection(database, data) {
  return database.addCollection('groups', ['slug', 'name']).insert(data);
}
