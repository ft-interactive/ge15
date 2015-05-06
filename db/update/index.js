'use strict';

const async = require('async');
const debug = require('debug')('db-update');

const use_mock_data = process.env.USE_MOCK_DATA === 'on';
const collect_results_data = process.env.COLLECT_RESULTS === 'on';

exports.seat_projections = require('./seat-projections');
exports.national_projections = require('./national-projections');
exports.ge15_PA_results = require('./ge15-PA-results');
exports.mock_nation_results = require('./mock-national-results');
exports.mock_seat_results = require('./mock-seat-results');

exports.results = function(cb) {

    cb = cb || function(){};

    debug('Update results - start');

    var tasks = [
     exports.mock_nation_results,
     exports.mock_seat_results
    ];

    async.parallel(tasks, function() {
      debug('Update results - complete');
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
    //exports.results
  ];

  function complete() {
    debug('Update all - complete');
    cb();
  }

  async.parallel(tasks, function() {
    complete();
  });

};
