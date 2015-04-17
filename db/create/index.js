'use strict';

const loki = require('lokijs');
const db = new loki('db/data.json');

exports.create_database = function(cb) {

  require('./seats').load(db);
  require('./regions').load(db);
  require('./parties').load(db);
  require('./groups').load(db);

  db.saveDatabase(cb);
};
