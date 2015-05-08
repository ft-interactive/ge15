'use strict';

const db = require('./db');

var expires;
var last;
var age = 1000 * 60;

module.exports = function(election) {
  if (last && expires && Date.now() < expires) {
    return last;
  }
  expires = Date.now() + age;

  var nodes = {};
  var links = {};

  var seatlist = db.seats().find().map(function(d){
    return {
      id:d.id,
      last:d.elections.last.winner.party,
      now:declared(d.elections.ge15.winner.party) // now:
    };
  });

  seatlist.forEach(function(d){
    if(!links[d.last + '->' + d.now]) links[d.last + '->' + d.now] = 0;
    links[d.last + '->' + d.now] ++;
    nodes[d.last + '-last'] = true;
    nodes[d.now + '-now'] = true;
  });

  var nodeIndices = {};

  var sankeyData = {
    nodes:Object.keys(nodes).map(function(d,i){
      nodeIndices[d] = i;
      return {'name':d.split('-')[0] };
    }),
    links:[]
  };

  for(var l in links){
    if (links.hasOwnProperty(l)) {
      var n = l.split('->');
      sankeyData.links.push({
        source:nodeIndices[n[0]+'-last'],
        target:nodeIndices[n[1]+'-now'],
        value:links[l]
      });
    }
  }

  last = Promise.resolve( sankeyData );

  return last;
};

function declared(p){
  if (!p) return 'undeclared';
  return p;
}
