'use strict';

const db = require('../../db');

// db.data_sources.update.national_projections();
// setInterval(db.data_sources.seat_projections, 1000 * 60);

exports.seats = function() {
  return db.getCollection('seats');
};

exports.regions = function() {
  return db.getCollection('regions');
};

exports.parties = function() {
  return db.getCollection('parties');
};

exports.groups = function() {
  return db.getCollection('groups');
};

exports.neighbours = function() {
  return db.getCollection('neighbours');
};
