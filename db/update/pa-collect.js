'use strict';

const debug = require('debug')('db-master:PA');
const updater = require('./ge15-PA-results');
const interval = 1000 * 60;

var started = false;

exports.start_polling = function(callback_first_time) {

  if (started) {
    debug('Already started. Exiting.');
    callback_first_time();
    return;
  }

  started = true;

  debug('Start polling the PA FTP');
  get_data(callback_first_time);

};

function get_data(cb) {

  debug('Calling get data on PA');
  cb = cb || function(){};

  function done() {
    cb();
    repeat();
  }

  updater.update(done);
}


function repeat() {
  debug('Scheduling a refresh in %dms', interval);
  setTimeout(get_data, interval);
}
