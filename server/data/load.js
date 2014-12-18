var co = require('co');

var constituencies = require('./constituencies');
var db = require('../models');
var slugify = require('speakingurl');
var dsv = require('dsv');
var fs = require('fs');
var _ = require('lodash');
var csv = dsv(',');

var regions = require('./regions').map(function(d){
  return d;
});

var partiesFile = fs.readFileSync(__dirname + '/parties.csv');
var parties = csv.parse(partiesFile.toString());

var counter = 1;
var electionsFile = fs.readFileSync(__dirname + '/election.csv');
var elections = csv.parse(electionsFile.toString()).map(function(d) {
  d.id = counter++;
  d.poll_date = new Date();
  d.electorate = d.electorate ? parseInt(d.electorate) : null;
  d.turnout = d.turnout ? parseInt(d.turnout) : null;
  d.turnout_pc = d.turnout_pc ? parseFloat(d.turnout_pc) : null;
  d.turnout_pc_change = d.turnout_pc_change ? parseFloat(d.turnout_pc_change) : null;
  d.majority = d.majority ? parseInt(d.majority) : null;
  d.swing = d.swing ? parseInt(d.swing) : null;
  d.majority_pc = d.majority_pc ? parseFloat(d.majority_pc) : null;
  d.majority_pc_change = d.majority_pc_change ? parseFloat(d.majority_pc_change) : null;
  d.winning_votes = d.winning_votes ? parseInt(d.winning_votes) : null;
  d.winning_candidate_id = d.winning_candidate_id ? parseInt(d.winning_candidate_id) : null;
  d.is_byelection = (d.is_byelection || '').toLowerCase() === 'true';
  d.is_notional = (d.is_notional || '').toLowerCase() === 'true';
  d.is_gain = (d.is_gain || '').toLowerCase() === 'true';
  return d;
});

var indexConstituencies = _.indexBy(constituencies, 'id');
var wards = {};
var wardsFile = fs.readFileSync(__dirname + '/wards.csv');
csv.parse(wardsFile.toString()).forEach(function(d) {
  var o = {};
  o.id = d.WD14CD.length === 6 ? ('SCOT' + d.WD14CD.replace(/\ /g, '')) : d.WD14CD;
  if (wards[o.id]) {
    wards[o.id].constituencies.push(d.PCON14CD);
    return;
  }
  o.name = d.WD14NM;
  o.slug = slugify(o.name);
  o.constituencies = [d.PCON14CD];
  o.region_id = indexConstituencies[d.PCON14CD].region_id;
  wards[o.id] = o;
});

wards = _.toArray(wards);

function m(d) {
  return d.values;
}

co(function *(){
  yield db.sequelize.drop();
  var connection = yield db.sequelize.sync({force:true});
  yield db.Region.bulkCreate(regions);
  yield db.Constituency.bulkCreate(constituencies);
  yield db.Party.bulkCreate(parties);
  yield db.Election.bulkCreate(elections);
  yield db.Ward.bulkCreate(wards);
})();
