'use strict';

const request = require('request-promise');
const db = require('./db');

module.exports = function(longtitude, latitude) {


  // http://mapit.mysociety.org/#api-by_point
  // "4325" means use "WGS84 lon/lat", rather than
  // another coordinate system such as British National Grid
  var opts = {
    uri: 'http://mapit.mysociety.org/point/4326/' + longtitude + ',' + latitude + '?type=WMC',
    json: true
  };

  return request(opts).then(function(data) {

    var properties = Object.keys(data);

    if (properties.length !== 1) {
      var noSeat = new Error('Location is not in a UK parliamentary constituency');
      noSeat.status = 404;
      throw noSeat;
    }

    var mysociety_id = properties[0].toString();
    var seat = db.seats().findOne({mysociety_id: mysociety_id});

    if (!seat) {
      console.error('MySociety mismatch for point. lon=' + longtitude + 'lat=' + latitude + 'mysociety_id=' + mysociety_id);
      var noSeat2 = new Error('Cannot find constituency');
      noSeat2.status = 404;
      throw noSeat2;
    }

    return Promise.resolve({seat: seat});

  });
};
