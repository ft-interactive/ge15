var dsv = require('dsv');
var fs = require('fs');
var _ = require('lodash');
var csv = dsv(',');
var file = fs.readFileSync(__dirname + '/constituencies.csv');
var regions = require('./regions');
var index = _.indexBy(regions, 'id');
var data = csv.parse(file.toString()).filter(function (c) {
  return !!c;
}).map(function (c) {
  c.region = index[c.region_id];
  return c;
});
module.exports = data;
