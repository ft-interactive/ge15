'use strict';

var partyShortName = require('./../data/party-data.js').shortNames;

function dataTable(g) {
  var table = g.append('div')
  .attr({
    'class':'constituency-group__summary-table',
    'data-o-grid-colspan': '12 M10 L8'
  })
  .append('table');

  table.append('thead').html('<tr><th></th><th>\u2001\uFEFFGain</th><th>\u2001\uFEFFLoss</th><th>\u2001\uFEFFHold</th></tr>');

  table.append('tbody')
  .selectAll('tr').data(function(d){
    console.log(' row ' ,d);
    return toArray(d.partychanges,'party','total').sort(function(a,b){
      var aMag = (a.gain + a.loss);
      var bMag = (b.gain + b.loss);
      if (aMag>bMag) return -1;
      if (aMag<bMag) return 1;
      if (a.party>b.party) return 1;
      if (a.party<b.party) return -1;
      return 0;
    });
  })
  .enter().append('tr').html(function(d) {
    return '<th class="' + d.party + ' rowhead">' + partyShortName[d.party] + '</th><td>' + numberCell(d.gain, '+\uFEFF', 0) + '</td><td>' + numberCell(d.loss, '\uFF0D', 0) + '</td><td>' + numberCell(d.hold, figureSpace, 0) + '</td>';
  });
}

var figureSpace = '\u2001';

function repeatString(str, num) {
  var r = [];
  if (num > 0) {
    while (num--) {
      r.push(str);
    }
  }
  return r.join('');
}

function numberCell(value, prefix, num) {
  prefix = prefix || '';
  if (prefix && value === 0) {
    prefix = figureSpace;
  }
  value = value.toString();
  num = num - value.length;
  return prefix + value + repeatString(figureSpace, num);
}

//utility function for converting an object into and array, each keyed value becoming an element
function toArray(o, keyname, ignorekeys) {
  var a = [];
  if (!keyname) keyname = 'key';
  if (!ignorekeys) ignorekeys = [];
  for (var i in o) {
    if (ignorekeys.indexOf(i) < 0) {
      o[i][keyname] = i;
      a.push(o[i]);
    }
  }
  return a;
}

module.exports = dataTable;
