var dsv = require('dsv');
var fs = require('fs');
var _ = require('lodash');
var csv = dsv(',');
var file = fs.readFileSync(__dirname + '/constituencies.csv');
var regions = require('./regions');
var index = _.indexBy(regions, 'id');
var data = csv.parse(file.toString()).filter(function (c) {
  return !!c;
})
.map(function (c) {
  c.bbc_id = c.bbc_id ? parseInt(c.bbc_id) : null;
  c.guardian_id = c.guardian_id ? parseInt(c.guardian_id) : null;
  c.pa_id = c.pa_id ? parseInt(c.pa_id) : null;
  var region = index[c.region_id];
  c.region_slug = region.slug
  c.region_name = region.name;
  return c;
});
module.exports = data;
