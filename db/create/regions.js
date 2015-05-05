'use strict';

const speakingurl = require('speakingurl');
const _ = require('lodash');

module.exports = {
  makeRegionsFromSeatData: makeRegionsFromSeatData,
  addCollection: addCollection,
  load: load
};

function load(db) {
  var seats = db.getCollection('seats').find();
  return addCollection(db, makeRegionsFromSeatData(seats));
}

function makeRegionsFromSeatData(seats) {

  // England is a special case
  // as it's not a real ONS region and contains
  // the actual english ONS regions... this special
  // region just allows us to have a superset of regions and seats
  var england = {
    id: 'E15000000',
    name: 'England',
    slug: 'england',
    seats: [],
    regions: []
  };

  var regions = seats.reduce(function(r, seat) {
    if (!seat.region_id) {
      throw new Error('No region ID for ' + seat.id);
    }

    if (!seat.region_name) {
      throw new Error('No region name for ' + seat.id);
    }

    if (r[seat.region_id]) {
      r[seat.region_id].seats.push(seat.id);
    } else {
      r[seat.region_id] = {
        id: seat.region_id,
        name: seat.region_name,
        slug: speakingurl(seat.region_name),
        seats: [seat.id],
        regions: []
      };
    }

    if (seat.region_id.charAt(0) === 'E') {
      var england = r.E15000000;
      england.seats.push(seat.id);
      england.regions.push({id: seat.region_id, name: seat.region_name});
    }

    return r;

  }, {E15000000: england});

  regions.E15000000.regions = _.sortBy(_.uniq(regions.E15000000.regions, 'id'), 'name');

  var regionsArray = _.values(regions);

  return _.sortBy(regionsArray, 'name');
}

function addCollection(database, data) {
  return database.addCollection('regions', ['id', 'name', 'slug']).insert(data);
}
