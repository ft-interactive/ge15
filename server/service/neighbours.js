'use strict';

const db = require('./db');
const _ = require('lodash');

module.exports = function(seat_id) {
  var data = db.neighbours().findOne({id: seat_id});
  if (!data) {
    var not_found_error = new Error('Seat not found');
    not_found_error.status = 404;
    return Promise.reject(not_found_error);
  }
  console.dir(data);
  var seats = db.seats().find({id: {'$in': data.neighbours}});

  return Promise.resolve(_.sortBy(seats, 'name'));

};
