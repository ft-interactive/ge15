'use strict';
var partyShortName = require('./../data/party-data.js').shortNames;

function dataTable(g){
  var table = g.append('div')
  .attr({
    'class':'constituency-group__data',
    'data-o-grid-colspan':12
  })
  .append('table');

  table.append('thead').html('<tr><th></th><th>Gain</th><th>Loss</th><th>Hold</th></tr>');

  table.append('tbody')
  .selectAll('tr').data(function(d){
    return toArray(d.partychanges,'party','total').sort(function(a,b){
      var aMag = (a.gain + a.loss);
      var bMag = (b.gain + b.loss);
      if(aMag>bMag) return -1;
      if(aMag<bMag) return 1;
      if(a.party>b.party) return 1;
      if(a.party<b.party) return -1;
      return 0;
    });
  })
  .enter().append('tr').html(function(d){
    return '<td class="' + d.party + ' rowhead">'+partyShortName[d.party]+'</td><td>+'+d.gain+'</td><td>-'+d.loss+'</td><td>'+d.hold+'</td>';
  });
}

//utility function for converting an object into and array, each keyed value becoming an element
function toArray(o, keyname, ignorekeys){
  var a = [];
  if(!keyname) keyname = 'key';
  if(!ignorekeys) ignorekeys = [];
  for(var i in o){
    if(ignorekeys.indexOf(i) < 0){
      o[i][keyname] = i;
      a.push(o[i]);
    }
  }
  return a;
}

module.exports = dataTable;
