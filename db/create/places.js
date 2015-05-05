// transform the wards and seats CSV files into a list of place names
// to provide a simple way to search

'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const dsv = require('dsv');
const csv = dsv(',');

const Types = {
  SEAT: 's',
  WARD: 'w',
  LOCAL_COUNCIL: 'l'
};

var places = new Map();

var wards = csv.parse(fs.readFileSync(path.resolve(__dirname, '../source/wards.csv')).toString());
var seats = csv.parse(fs.readFileSync(path.resolve(__dirname, '../source/ONS-PA-xref.csv')).toString());

function add(name, id, type) {

  var place = places.get(name);

  if (!place) {
    place = { ids: [], type: type};
  }

  place.ids.push(id);
  places.set(name, place);
}

wards.forEach(function(ward) {
  add(ward.ward_name + ', ' + ward.local_council_name, ward.seat_id, Types.WARD);
  add(ward.local_council_name, ward.seat_id, Types.LOCAL_COUNCIL);
});

seats.forEach(function(seat) {
  add(seat.ons_name, seat.ons_id, Types.SEAT);
  add(seat.pa_name, seat.ons_id, Types.SEAT);
});


console.log('name,type,ids');
places.forEach(function(place, name) {
  console.log('"%s",%s,%s', name, place.type, _.uniq(place.ids).join(' '));
});
