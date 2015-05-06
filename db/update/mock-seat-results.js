'use strict';

const fs = require('fs');
const path = require('path');
const db = require('../loki');

var already_loaded = false;

module.exports = function(cb) {

  if (already_loaded) {
    cb();
    return;
  }

  already_loaded = true;

  var filename = path.resolve(__dirname, '../source/seats-with-mock-pa-results.json');

  fs.readFile(filename, function(err, data){
    if (err) throw err;
    var str = data.toString();
    var seats = JSON.parse(str);
    var collection = db.getCollection('seats');

    var updated = seats.map(function(seat){

      var found = collection.findOne({id: seat.id});
      if (!found) {
        throw new Error('Cannot find seat ' + seat.id);
      }
      found.elections.ge15 = seat.elections.ge15;
      return found;
    });

    collection.update(updated);
    cb();
  });

};
