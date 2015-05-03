'use strict';

const request = require('request-promise');
const db = require('./db');

module.exports = function(lon, lat) {

  if (!isValidPoint(lon, lat)) {
    return Promise.reject(err(400, 'Not a valid lon lat coodinates point'));
  }

  // LK: this won't filter out Rep. of Ireland or Isle of Mann, for instance.
  // it may also include a tiny bit of northern europe be belgium, but I didn't check.
  if (!isInsideBritishIsles(lon, lat)) {
    return Promise.reject(err(400, 'Your position is not in the UK'));
  }

  // API docs: http://mapit.mysociety.org/#api-by_point
  // LK: note that the "4325" in the URL means use the "WGS84 lon/lat" coordinate
  // system, rather than another system such as British National Grid
  var opts = {
    uri: 'http://mapit.mysociety.org/point/4326/' + lon + ',' + lat + '?type=WMC',
    json: true
  };

  return request(opts).then(function(data) {

    var properties = Object.keys(data);

    if (properties.length !== 1) {
      throw err(404, 'Location is not in a UK parliamentary constituency');
    }

    var mysociety_id = properties[0].toString();
    var seat = db.seats().findOne({mysociety_id: mysociety_id});

    if (!seat) {
      console.error('MySociety mismatch for point. lon=' + lon + 'lat=' + lat + 'mysociety_id=' + mysociety_id);
      throw err(404, 'Cannot find constituency');
    }

    return Promise.resolve({seat: seat});

  });

  // TODO: handle error
  // 404 lat lon not found???? is this possible
  // 400 bad request
  // 403 Rate limit
};

// Note that a UK bounding box include land that's not
// UK or has Parliamentary Constituencies.
const ukBoundingBox = {
  west: -8.194480, // west of Northern Ireland
  east: 1.763340, // east of Norfolk
  north: 60.860699, // north of Shetland
  south: 49.871159 // south of Cornwall (Scilly)
};

function isInsideBritishIsles(lon, lat) {
  lon = Number(lon);
  lat = Number(lat);

  if (isNaN(lon) || !lon || isNaN(lat) || !lat) {
    return false;
  }

  return lon >= ukBoundingBox.west && lon <= ukBoundingBox.east &&
         lat <= ukBoundingBox.north && lat >= ukBoundingBox.south;
}

function isValidPoint(lon, lat) {
  var nLon = Number(lon);
  var nLat = Number(lat);
  return !(isNaN(nLon) || isNaN(nLat));
}

function err(status, message) {
  var e = new Error(message);
  e.status = status || 404;
  return e;
}
