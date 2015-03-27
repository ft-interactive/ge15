'use strict';

var parties = require('uk-political-parties');

var partylist = ['c', 'lab', 'ld', 'snp', 'pc', 'green', 'ukip', 'other'];

function predictedWinner(record){
  var maxValue = 0;
  var winningParty = '';
  partylist.forEach(function(p){
    var value = Number(record[parties.electionForecastName(p)]);
    maxValue = Math.max(value, maxValue);
    if(maxValue === value){
      winningParty = p;
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
    if(r.hasOwnProperty(item) && parties.electionForecastToCode(item)){
      abbreviated[ parties.electionForecastToCode(item) ] = r[item];
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
  var tableData = [];
  for(var r in summary){
    if(summary.hasOwnProperty(r) && r !== 'total'){
      tableData.push({
        party:r,
        gain:summary[r].gain,
        loss:summary[r].loss,
        hold:summary[r].hold,
        aggregate:summary[r].gain - summary[r].loss
      });
    }
  }
  return {
    total:summary.total,
    table:tableData.sort(function(a,b){return b.aggregate - a.aggregate})
  };
}



module.exports = function(groups, current, prediction, locations, details){

  return groups.map(function(d) {
    var remap = false;
    if (d['constituencies..list']) {
      d.constituencies = d['constituencies..list'].split(',');
      delete d['constituencies..list'];
      remap = true;
    }

    if (d.bucket) {
      d.headline = d.bucket;
      delete d.bucket;
    }

    d.constituencies = d.constituencies.map(function(e){
      var constituencyID = remap ? e.trim() : e.id;
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

};
