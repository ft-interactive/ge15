'use strict';

const async = require('async');
const debug = require('debug')('db-update');

const use_mock_data = process.env.USE_MOCK_DATA === 'on';
const collect_results_data = process.env.COLLECT_RESULTS === 'on';

exports.seat_projections = require('./seat-projections');
exports.national_projections = require('./national-projections');
exports.ge15_PA_seat_results = require('./ge15-PA-seat-results');
exports.ge15_PA_SOP_results = require('./ge15-PA-SOP-results');
exports.mock_nation_results = require('./mock-national-results');

exports.all = function(cb) {

  cb = cb || function(){};

  debug('Update all');

  // TODO: how to do the cotrol flow here?
  //       perhaps you async waterfall?
  //       but may be the updater functions themselves must
  //             decide what to wait on.. eg an event from another updater

  var tasks = [
    exports.seat_projections,
    exports.national_projections,
  ];

  if (collect_results_data) {
    tasks.push(exports.ge15_PA_seat_results);
    tasks.push(exports.ge15_PA_SOP_results);
  }

  function complete() {
    debug('Update all complete');
    cb();
  }

  async.parallel(tasks, function() {
    if (!use_mock_data) {
      complete();
      return;
    }
    exports.mock_nation_results(complete);
  });

};
