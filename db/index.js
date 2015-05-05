'use strict';

const fs = require('fs');
const instance = require('./loki');
const update = require('./update');
const model = require('./model');

instance.model = model;

instance.data_sources = {
  update: update
};

instance.reload_sync = function() {
  instance.loadJSON(fs.readFileSync(__dirname + '/data.json').toString());
  return instance;
};

var started = false;

instance.start = function() {
  if (started) return instance;
  started = true;
  return instance.reload_sync();
};


module.exports = instance;
