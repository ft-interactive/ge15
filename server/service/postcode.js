'use strict';

const request = require('request-promise');
var Postcode = require('postcode');
const db = require('./db');
const knowPostcodes = new Map();
const Reasons = {NOT_FOUND: 'NOT_FOUND', INVALID: 'INVALID'};

function createRejection(postcode, reason) {
  var status = reason === Reasons.INVALID ? 400 : 404;
  var message = reason === Reasons.INVALID ? ('"' + postcode + '" is not a valid postcode.') : ('Postcode "' + postcode + '" not found');
  var err = new Error(message);
  err.status = status;
  return Promise.reject(err);
}

function recordUnknownPostcode(postcode, reason) {
  knowPostcodes.set(postcode, reason || Reasons.NOT_FOUND);
  return createRejection(postcode);
}

function isValidPostcode(postcode) {
  return /^[A-Z0-9]{1,4}\s*?\d[A-Z]{2}$/.test(postcode);
}

module.exports = function(postcode) {

  var originalPostcode = postcode;
  postcode = postcode.replace(/\s/, '').toUpperCase();

  if (!isValidPostcode(postcode)) {
    return createRejection(originalPostcode, 'INVALID');
  }

  if (knowPostcodes.has(postcode)) {
    var id = knowPostcodes.get(postcode);

    if (id === 'NOT_FOUND') {
      return createRejection(originalPostcode, id);
    }

    return Promise.resolve({
      seat: db.seats().findOne({id: id}),
    });
  }

  return request({uri:'http://mapit.mysociety.org/postcode/' + postcode , json: true}).then(function(data) {

    var mySocietyID = data.shortcuts.WMC.toString();
    var seat = db.seats().findOne({mysociety_id: mySocietyID});

    if (!seat) {
      var mismatchID = new Error('Cannot find seat with MySociety ID ' + mySocietyID);
      mismatchID.statusCode = 404;
      throw mismatchID;
    }

    knowPostcodes.set(postcode, seat.id);
    return {
      seat: seat,
      postcode: postcode
    };

  }).catch(function(reason){
    return recordUnknownPostcode(originalPostcode, reason.statusCode === 400 ? 'INVALID' : 'NOT_FOUND');
  });

};
