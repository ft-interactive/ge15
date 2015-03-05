'use strict';

var d3 = require('d3');
//var parties = require('../../data/parties.js');
// var partyByAbbrv = makeLookup(d3.values(parties),'abbrv');

var partyLookups = {
  partylist:['Conservatives', 'Labour', 'Liberal Democrats', 'SNP', 'Plaid Cymru', 'Greens', 'UKIP', 'Other'],
  abbreviations:{'Conservatives':'c', 'Labour':'lab', 'Liberal Democrats':'ld', 'SNP':'snp', 'Plaid Cymru':'pc', 'Greens':'green', 'UKIP':'ukip', 'Other':'other'}
};

function makeLookup(a, property) {
  var o = {};
  a.forEach(function(d) {
    o[d[property]] = d;
  });
  return o;
}

function predictedWinner(record){
  var maxValue = 0;
  var winningParty = '';
  partyLookups.partylist.forEach(function(p){
    maxValue = Math.max(Number(record[p]), maxValue);
    if(maxValue === Number(record[p])){
      winningParty = partyLookups.abbreviations[p];
    }
  });
  return winningParty;
}

function resultNormalise(r) {
  var lowerCased = {};

  for(var item in r){
    if(r.hasOwnProperty(item)){
      lowerCased[item.toLowerCase()] = r[item];
    }
  }

  var normalised = {
    lab:0,
    c:0,
    ld:0,
    green:0,
    ukip:0,
    snp:0,
    pc:0
  };
  var pctScale = 100 / r.votes;
  var remainder = 100;
  for (var party in normalised) {
    if (normalised.hasOwnProperty(party)) {
      normalised[party] = Math.round(lowerCased[party]*pctScale * 100) / 100;
      remainder -= normalised[party];
    }
  }
  normalised.Other = remainder;
  return normalised;
}

function predictionNormalise(r){
  var abbreviated = {};
  for(var item in r){
    if(r.hasOwnProperty(item) && partyLookups.abbreviations[item]){
      abbreviated[ partyLookups.abbreviations[item] ] = r[item];
    }
  }
  return abbreviated;
}

function makeSlopes(current,predicted,winner,holder){
  current = resultNormalise(current);
  predicted = predictionNormalise(predicted);
  var parties = [];
  for(var party in predicted){
    if(predicted.hasOwnProperty(party)){
      var partySlope = {
        "party": party,
        "resultnow": current[party],
        "resultprediction": Number(predicted[party]),
      };
      if(winner === party){
        partySlope.winner = true;
      }
      if(holder === party){
        partySlope.holder = true;
      }
      parties.push(partySlope);
    }
  }
  parties = parties.filter(function(p) {
    var voteShareThreshold = 5;
    if(!p.resultprediction) p.resultprediction = 0;
    if(!p.resultnow) p.resultnow = 0;
    if(p.resultprediction < voteShareThreshold && p.resultnow < voteShareThreshold){
      return false;
    }
    return true;
  });
  return parties;
}

function groupOverview(group){
  var summary = {total: 0};
  group.forEach(function(d){
    summary.total++;
    if (d.holdernow !== d.holderpredicted) {
      if (!summary[d.holdernow]) {
        summary[d.holdernow] = {gain:0,loss:0,hold:0};
      }
      if (!summary[d.holderpredicted]){
        summary[d.holderpredicted] = {gain:0,loss:0,hold:0};
      }
      summary[d.holdernow].loss ++;
      summary[d.holderpredicted].gain ++;
    } else {
      if (!summary[d.holdernow]){
        summary[d.holdernow] = {gain:0,loss:0,hold:0};
      }
      summary[d.holdernow].hold ++;
    }
  });
  return summary;
}

module.exports = function(groups, current, prediction, locations, details){
  //objectify the spreadsheets including sorting out list fields
  current = makeLookup( d3.tsv.parse(current), 'id' );
  prediction = makeLookup( d3.tsv.parse(prediction), 'id' );
  locations = makeLookup( d3.tsv.parse(locations), 'id' );
  details = makeLookup( d3.tsv.parse(details), 'ons_id' );

  groups = d3.tsv.parse(groups).map(function(d){
    d.constituencies = d['constituencies..list'].split(',');
    d.headline = d.bucket;
    delete d.bucket;
    delete d['constituencies..list'];

    d.constituencies = d.constituencies.map(function(e){
      var constituencyID = e;
      var predicted = prediction[constituencyID];
      var forecastWinner = predictedWinner(predicted);
      var currentHolder = current[constituencyID].winner.toLowerCase();

      e = {
        id:constituencyID,
        name:details[constituencyID].ft_name,
        region:details[constituencyID].region_name,
        holdernow:currentHolder,
        holderpredicted:forecastWinner,
        coords: [
          locations[constituencyID].lon,
          locations[constituencyID].lat ],
        parties:makeSlopes(current[constituencyID], predicted, forecastWinner, currentHolder)
      };
      return e;
    });
    d.partychanges = groupOverview( d.constituencies );
    return d;
  });

  return groups;
};
