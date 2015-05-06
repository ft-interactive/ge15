'use strict';

const debug = require('debug')('db-slave:parties');
const request = require('request-promise');
const db = require('../loki');
const master = process.env.MASTER_PARTIES_RESULTS;
const interval = 1000 * 60;

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
    .then(function(parties) {

      debug('Got %d parties from master url %s', parties.length, master);

      var collection = db.getCollection('parties');
      var updated = parties.map(function(party) {

        var found = collection.findOne({id: party.id});
        if (!found) {
          throw new Error('Cannot find party ' + party.id);
        }
        found.elections.ge15 = party.elections.ge15;
        return found;
      });

      if (updated.length) {
        debug('Updating Parties collection with %d rows', updated.length);
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
