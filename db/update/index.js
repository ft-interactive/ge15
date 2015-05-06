'use strict';

const async = require('async');
const debug = require('debug')('db-update');
const slave_seats = require('./slave-seats');
const slave_parties = require('./slave-parties');

const is_master = (process.env.REPLICATION || '').toLowerCase() === 'master';
const is_slave = (process.env.REPLICATION || '').toLowerCase() === 'slave';
const is_local = (process.env.REPLICATION || '').toLowerCase() === 'local';
const is_polling_on = is_master || is_slave;

exports.seat_projections = require('./seat-projections');
exports.national_projections = require('./national-projections');
exports.ge15_PA_results = require('./ge15-PA-results');
exports.mock_nation_results = require('./mock-national-results');
exports.mock_seat_results = require('./mock-seat-results');

exports.mock_results = function(cb) {

    cb = cb || function(){};

    debug('Update mock results - start');

    var tasks = [
     exports.mock_nation_results,
     exports.mock_seat_results
    ];

    async.parallel(tasks, function() {
      debug('Update mock results - complete');
      cb();
    });
};

exports.projections = function(cb) {

  cb = cb || function(){};

  debug('Update projections - start');

  var tasks = [
    exports.seat_projections,
    exports.national_projections,
  ];

  async.parallel(tasks, function() {
    debug('Update projections - complete');
    cb();
  });
};

exports.all = function(cb) {

  cb = cb || function(){};

  debug('Update all - start');

  var tasks = [
    exports.projections,
  ];

  if (is_polling_on) {
    if (is_slave) {
      debug('Polling is ON. Replication=slave');
      tasks.push(slave_seats.start_polling);
      tasks.push(slave_parties.start_polling);
    } else if (is_master) {
      debug('Polling is ON. Replication=master');
      //TODO: start polling PA FTP
    }
  } else {
    debug('Polling is OFF, no replication will happen');
    if (is_local) {
      debug('Using local mock data instead');
      tasks.push(exports.mock_results);
    }
  }

  function complete() {
    debug('Update all - complete');
    cb();
  }

  async.parallel(tasks, complete);

};
