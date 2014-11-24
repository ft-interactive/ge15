var dsv = require('dsv');
var fs = require('fs');
var slugify = require('speakingurl');

var csv = dsv(',');
var file = fs.readFileSync(__dirname + '/parties.csv');

var data ={};
csv.parse(file.toString()).forEach(function(d,i){
  data[d.fullname] = d;
});

module.exports = data;
