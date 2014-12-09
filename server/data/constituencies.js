var dsv = require('dsv');
var fs = require('fs');
var csv = dsv(',');
var file = fs.readFileSync(__dirname + '/constituencies.csv');
var data = csv.parse(file.toString()).filter(function(c){
  return !!c;
});
module.exports = data;
