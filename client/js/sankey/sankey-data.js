'use strict';

module.exports = function createSankeyData(data){
  var nodes = {};
  var links = {};

  data = data.map(function(d){
    d.forecast = forecastWinner(d);
    return d;
  });

  //pad the data so we include NI
  var extraRows = 650-data.length;
  for(var i=0; i<extraRows; i++){
    data.push({
      current:'Other',
      forecast:'Other'
    });
  }
  console.log('d',data);

  data.forEach(function(d){
    if(!links[d.current + '->' + d.forecast]) links[d.current + '->' + d.forecast] = 0;
    links[d.current + '->' + d.forecast] ++;
    nodes[d.forecast + '-forecast'] = true;
    nodes[d.current + '-current'] = true;
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
        source:nodeIndices[n[0]+'-current'],
        target:nodeIndices[n[1]+'-forecast'],
        value:links[l]
      });
    }
  }
  console.log('sankey data', sankeyData);
  return sankeyData;
};

function forecastWinner(o){
  var maxVote = 0;
  var leadingParty = '';
  for (var i in o){
    if (o.hasOwnProperty(i)) {
      if(!isNaN(o[i])){
        maxVote = Math.max(maxVote,parseInt(o[i]));
        if(maxVote === parseInt(o[i])) leadingParty = i;
      }
    }
  }
  return leadingParty;
}
