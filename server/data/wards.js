var dsv = require('dsv');
var fs = require('fs');
var slugify = require('speakingurl');

var csv = dsv(',');
var file = fs.readFileSync(__dirname + '/wards.csv');

function format(ward){
  var o = {};
  o.name = ward.WD14NM;
  o.slug = slugify(o.name);
  o.id = ward.WD14CD;
  o.constituency = {
    id: ward.PCON14CD,
    name: ward.PCON14NM,
    slug: slugify(ward.PCON14NM)
  };

  return o;
}

var data = csv.parse(file.toString()).map(format);

module.exports = data;
