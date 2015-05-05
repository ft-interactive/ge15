'use strict';

const db = require('../loki');
const national_projections = require('./national-projections');
const _ = require('lodash');

var already_loaded = false;


module.exports = function(cb) {

  if (already_loaded) {
    cb();
    return;
  }

  national_projections(function(){
    var parties = db.getCollection('parties');
    var updatedParties = parties.find().map(function(party) {
      party.elections.ge15 = _.clone(party.elections.ge15_projection, true);
      delete party.elections.ge15.seats_lo;
      delete party.elections.ge15.seats_hi;
      // TODO: add mock data for

      // votes
      // votes_pc
      // seats_gain
      // seats_loss

      // apply hard coded numbers seat and seats_pc over the top
      // of the projections

      // TODO: -1 from conservatives if speaker is a Conservative and his seat has been called.
      return party;
    });
    var sinnfein = parties.findOne({id: 'sf'});
    sinnfein.elections.ge15.seats = 5;
    sinnfein.elections.ge15.seats_pc = 5 / 6.5;
    var other = parties.findOne({id: 'other'});
    other.elections.ge15.seats -= 5;
    other.elections.ge15.seats_pc -= 5 / 5.6;
    parties.update(updatedParties);
    cb();
  });
};
