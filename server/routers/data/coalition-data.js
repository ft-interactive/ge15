'use strict';

var d3 = require('d3');


function getPartyList(str){
  var listString = str.replace(' majority','');
  listString = listString.replace('UKIP','ukip');
  listString = listString.replace('SNP','snp');
  listString = listString.replace('DUP','dup');
  listString = listString.replace('Labour','lab');
  listString = listString.replace('Lib Dem','ld');
  listString = listString.replace('Conservative','c');
  listString = listString.replace('Left Minority','pc/green');
  listString = listString.replace('All left','lab/pc/green/snp'); //TODO does this need any more parties? find out
  return listString.split('/');
}

var coalitionOrder = ['Labour majority', 'Labour/Left Minority', 'Labour/SNP', 'Labour/SNP/Left Minority', 'All left', 'Labour/SNP/Lib Dem', 'Labour/Lib Dem', 'Labour/Lib Dem/Left Minority', 'Conservative/Lib Dem', 'Conservative/Lib Dem/DUP', 'Conservative/DUP', 'Conservative/DUP/UKIP', 'Conservative majority'];

module.exports = function transform(data) {
  var major = [];
  var coalitions = data.map(function(d){
    d.Scenario = d.Scenario.replace('Tory','Conservative');
    d.Scenario = d.Scenario.replace(/\s*\/\s*/g,'/');
    d.Scenario = d.Scenario.replace(/\s*\+\s*/g,'/');
    d.Scenario = d.Scenario.replace('min','Minority');
    d.Scenario = d.Scenario.replace('LD','Lib Dem');
    d.occurrence = parseFloat(d.occurrence);
    var c = {
      name:d.Scenario,
      parties:getPartyList(d.Scenario),
      probability:Number(d.occurrence)
    };
    return c;
  })
  .sort(function(a, b){
    return coalitionOrder.indexOf(a.name)-coalitionOrder.indexOf(b.name);
  });

  return {
    coalitions:coalitions,
    majorParties:major,
    update:new Date()
  };
};
