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

var places = (function() {
 var data = csv.parse(fs.readFileSync(path.resolve(__dirname, './places.csv')).toString());

 return data.map(function(row) {
   return [row.name, row.type, row.ids.split(/\s/g)];
 });

})();

function normalise(str) {
  return str.toUpperCase().replace(/[\s,\-\&]/g, '');
}

var sets = {
  EXACT_SEAT: 0,
  STARTS_WITH_SEAT: 1,
  EXACT: 2,
  STARTS_WITH: 3,
  CONTAINS_SEAT: 4,
  CONTAINS: 5
};

module.exports = function(search) {

  var searchnorm = normalise(search);
  var m = {};
  var results = places.reduce(function(r, p) {
    var place = p[0];
    var type = p[1];
    var placenorm = normalise(place);
    var i, j;

    // exact match
    if (placenorm === searchnorm) {

      r[Types.SEAT === type ? sets.EXACT_SEAT : sets.EXACT].push(p);
      return r;

    } else {
      i = placenorm.indexOf(searchnorm);
      j = searchnorm.indexOf(placenorm);

      // starts with
      if (i === 0 || j === 0) {
        r[Types.SEAT === type ? sets.STARTS_WITH_SEAT : sets.STARTS_WITH].push(p);
        return r;
      }

      // contains
      if (i > 0 || j > 0) {
        r[Types.SEAT === type ? sets.CONTAINS_SEAT : sets.CONTAINS].push(p);
        return r;
      }
    }

    return r;
  }, [[],[],[],[],[],[]]);

  var rrr = results.reduce(function(r, a, x){
    for (var i = 0; i < a.length; i++) {
      for (var j = 0; j < a[i][2].length; j++) {
        if (!r.hasOwnProperty(r[a[i][0]])) {
          r[a[i][0]] = {name: a[i][0], rank: x, ids: [a[i][2][j]]};
        } else {
          r[a[i][0]].ids.push(a[i][2][j]);
        }
      }
    }
    return r;
  }, {});

  var possibleResults = _.sortBy(_.values(rrr), 'rank').map(function(d) {
    return [d.name, d.ids];
  });

  console.log(possibleResults);
  return Promise.resolve(results);
};
