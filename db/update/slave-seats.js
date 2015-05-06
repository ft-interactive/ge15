'use strict';

const debug = require('debug')('db-slave:seats');
const request = require('request-promise');
const db = require('../loki');
const master = process.env.MASTER_SEAT_RESULTS;
const interval = process.env.SEAT_RESULTS_INTERVAL ? parseInt(process.env.MASTER_SEAT_RESULTS) : 1000 * 60;

var started = false;

exports.start_polling = function(callback_first_time) {

  if (started) {
    debug('Already started. Exiting.');
    callback_first_time();
    return;
  }

  started = true;

  if (master) {
    debug('Start polling %s', master);
    get_data(callback_first_time);
  } else {
    debug('No master url is set so there is nothing to poll,');
    callback_first_time();
  }
};

function repeat() {
  debug('Scheduling a refresh in %dms', interval);
  setTimeout(get_data, interval);
}

function get_data(cb) {

  debug('Getting seats data from master url %s', master);

  cb = cb || function(){};

  request({uri: master, json: true})
    .then(function(seats) {

      debug('Got %d seats from master url %s', seats.length, master);

      var collection = db.getCollection('seats');
      var updated = seats.map(function(seat) {

        var found = collection.findOne({id: seat.id});
        if (!found) {
          throw new Error('Cannot find seat ' + seat.id);
        }
        found.elections.ge15 = seat.elections.ge15;
        return found;
      });

      if (updated.length) {
        debug('Updating Seats collection with %d rows', updated.length);
        collection.update(updated);
      }
      cb();
      repeat();
    }).catch(function(err){
      debug('Error getting %s from master', master);
      console.error(err.message);
      console.error(err.stack);
      cb();
      repeat();
    });
}
