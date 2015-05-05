'use strict';

const debug = require('debug')('db-update:all');

var maxAge = 1000 * 60 * 60;
var fetching = false;
var expires = 0;

function update(cb) {

  cb = cb || function(){};

  if (Date.now() < expires || fetching) return;

  fetching = true;

  /// do it
  fetching = false;
  expires = Date.now() + maxAge;
}

module.exports = update;
