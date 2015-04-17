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
    parties.update(updatedParties);
    cb();
  });
};
