'use strict';

//DATA PROCESSING this should be done server side
function constituencySlopeData(spreadsheet){ //takes a bertha JSON spreadsheet with the following sheets
  //data ... a list of lists of constituency ids
  //resultsnow ... constituency results as of the last election that took place there (by election or 2010 general)
  //details ... full constituency name, ft slug etc
  //predictions ... data from electionforecast.co.uk containing predicted 2015 results

  spreadsheet.resultnow = makeLookup( spreadsheet.resultnow, 'id' );
  spreadsheet.predictions = makeLookup( spreadsheet.predictions, 'id' );
  spreadsheet.coordinates = makeLookup( spreadsheet.coordinates, 'id' );

  //create constituency objects
  var constituencies = spreadsheet.details.map(function(c){
    var now = resultNormalise( spreadsheet.resultnow[c.onsid] );
    var prediction = spreadsheet.predictions[c.onsid];
    var coords = spreadsheet.coordinates[c.onsid];
    var parties = [];
    var partyindex  = 0;
    var maxPredictionIndex = 0;
    var maxPrediction = 0;

    for(var p in now){
      var record = {
        party: p,
        resultnow: now[p]
      };

      if(prediction){
        maxPrediction = Math.max(prediction[p], maxPrediction);
        if(maxPrediction === prediction[p]) { maxPredictionIndex = partyindex; }
        record.resultprediction = prediction[p];
      }
      //work out the winner
      parties.push(record);
      partyindex ++;
    }
    parties[maxPredictionIndex].winner = true;
    //filter parties so it doesnt include parties with 0->0 or 0->undefined
    parties = parties.filter(function(p){
      var voteShareThreshold = 5;
      if(!p.resultprediction) p.resultprediction = 0;
      if(!p.resultnow) p.resultnow = 0;
      if(parseFloat(p.resultprediction) < voteShareThreshold && parseFloat(p.resultnow) < voteShareThreshold){
        return false;
      }
      return true;
    });

    var holderNowValue = 0 , holderNow,
    holderPredictedValue = 0, holderPredicted;
    for (var p in parties){
      if(parties[p].resultnow > holderNowValue){
        holderNowValue = parties[p].resultnow;
        holderNow = parties[p].party;
      }

      if(parties[p].resultprediction !== undefined){
        if(parties[p].resultprediction > holderPredictedValue){
          holderPredictedValue = parties[p].resultprediction;
          holderPredicted = parties[p].party;
        }
      }
    }


    var o = {
      name: c.ftname,
      id: c.onsid,
      region: c.regionname,
      holdernow: holderNow,
      coords:[coords.lon, coords.lat,],
      holderpredicted: holderPredicted,
      parties: parties
    };
    return o;
  });
  constituencies = makeLookup(constituencies, 'id');

  for(var list in spreadsheet.data){
    spreadsheet.data[list] = {
      headline:spreadsheet.data[list].bucket,
      description:spreadsheet.data[list].description,
      constituencies:populateGroup(spreadsheet.data[list].constituencies, constituencies)
    };
    spreadsheet.data[list].partychanges = getPartyChanges(spreadsheet.data[list].constituencies);
  }

  return spreadsheet.data;




  //helpful functions...
  function getPartyChanges(list){
    var summary = {total:0};
    list.forEach(function(d){
      summary.total ++;
      if(d.holdernow !== d.holderpredicted){
        if(!summary[d.holdernow]){ summary[d.holdernow] = {gain:0,loss:0,hold:0}; }
        if(!summary[d.holderpredicted]){ summary[d.holderpredicted] = {gain:0,loss:0,hold:0}; }
        summary[d.holdernow].loss ++;
        summary[d.holderpredicted].gain ++;
      }else{
        if(!summary[d.holdernow]){ summary[d.holdernow] = {gain:0,loss:0,hold:0}; }
        summary[d.holdernow].hold ++;
      }
    });

    return(summary);
  }

  function populateGroup(list, constituencies){
    return list.map( function(d){
      return constituencies[d];
    } ).sort();
  }

  function resultNormalise(r){ //transform the result data in percentages, use only parties for which we have predictions
    var normalised = {
      lab:0,
      c:0,
      ld:0,
      green:0,
      ukip:0,
      snp:0,
      pc:0
    };
    var pctScale = 100/r.votes;
    var remainder = 100;
    for(var party in normalised){
      normalised[party] = Math.round(r[party]*pctScale * 100)/100;
      remainder -= normalised[party];
    }
    normalised.other = remainder;
    return normalised;
  }

  function makeLookup(a, property){
    var o = {};
    a.forEach(function(d){
      o[d[property]] = d;
    });
    return o;
  }
}

module.exports = constituencySlopeData;
