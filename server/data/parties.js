'use strict';

const db = require('./db');

var parties;

function refresh() {
  parties = Promise.resolve(db.parties().find());
}

refresh();
setInterval(refresh, 1000 * 120);

module.exports = function(election) {
  refresh();
  return parties;
};
