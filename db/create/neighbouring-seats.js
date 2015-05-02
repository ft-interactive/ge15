'use strict';

//  * Use the MapIt's "touches" endpoint to get a seat's neighbouring seats
//       i.e the ones it borders
//  * outputs CSV format to standard out.
//  * the neighbours column of the spreadsheet is a space delimited array
//  * sometimes the MapIt service throws errors for some seats,
//       these seats still appear in the output but
//       they have no neighbouring seats
//       and these errror are printed at the end.

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const dsv = require('dsv');
const csv = dsv(',');
const request = require('request-promise');
const async = require('async');

var rows = csv.parse(fs.readFileSync(path.resolve(__dirname, '../source/ONS-MySociety-xref.csv')).toString());
var seats = _.uniq(rows, 'ons_id');
var urls = seats.map(function(seat) {
  return { id: seat.ons_id, url: 'http://mapit.mysociety.org/area/'+ seat.mysociety_id +'/touches?type=WMC'};
});

if (urls.length !== 650) {
  throw new Error('Not correct number of seats. Expect 650, found ' + urls.length);
}

function response_to_ONS_ID_array(id) {
  return function(response) {
    return {
      id: id,
      neighbours: _.pluck(_.pluck(_.values(response), 'codes'), 'gss')
    };
  };
}

var errors = [];

function onerror(id) {
  return function(err) {
    errors.push(id);
    return {id: id, neighbours: []};
  };
}

var q = async.queue(function (seat, callback) {
  // delay each call to the MapIt service to get around the API rate limit
  setTimeout(function() {
    request({uri: seat.url, json: true}).then(response_to_ONS_ID_array(seat.id))
                                        .catch(onerror(seat.id))
                                        .then(callback);
  }, 5000);
}, 1);

var results = [];

q.drain = function() {
  console.log('\n\n\n----- ERRORS ----\n');
  console.log(errors.join(','));
  process.exit(0);
};

console.log('id,neighbours');
q.push(urls, function(result) {
  results.push(result);
  console.log([result.id, result.neighbours.join(' ')].join(','));
});
