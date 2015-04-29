'use strict';

/* global forecast */

var d3 = require('d3');
var parties = require('uk-political-parties');
var debounce = require('lodash/function/debounce');

var sliderMargin = { top:5, left:0, bottom:0, right:0 };
var coalitionsMargin = {top:1, left:160, bottom:20, right:50};
var voteDistribution = [];
var sliderScale = d3.scale.linear().clamp(true);
var coalitionScale = d3.scale.linear();
var partyPosition = {};
var controllableParties;


var coalitions = [
  ['c'],
  ['lab'],
  ['ld','c'],
  ['ld','lab'],
  ['snp','lab'],
  ['dup','c'],
  ['ukip','c'],
  ['ld','snp','lab'],
  ['dup','ld','c'],
  ['ukip','ld','c'],
  ['ukip','dup','c'],
  ['ukip','dup','ld','c'],
  ['green','sdlp','snp','lab'],
  ['green','pc','snp','lab'],
  ['green','pc','ld','lab'],
  ['green','sdlp','pc','snp','lab'],
  ['c','lab']
];

var barHeight = 40;
var handleWidth = 31;
var handleHeight = 36;
var inputHeight = barHeight + sliderMargin.top+sliderMargin.bottom+handleHeight;


require('./ready.js').then(function(){
  //create the vote distribution model
  voteDistribution = makeVoteDistribution(forecast.data);
  setUp();
  drawSliderInput();
  drawCoalitions();
  //draw the input based on the model
});

function checksum(o){
  var sum = 0;
  for(var key in o){
    if(o.hasOwnProperty(key)){
      sum += o[key];
    }
  }
  return (sum === 650);
}

function readHash(){
  if(window.location.hash) {
    var userData = {};
    window.location.hash.split(',').forEach(function(d){
      d = d.split(':');
      userData[ d[0].replace('#','') ] = parseInt(d[1]);
    });
    console.log(userData);
    if(!checksum(userData)){ console.warn('user parties don\'t add up'); return; }
    for(var p in voteDistribution){
      if(userData[voteDistribution[p].party] !== undefined){
        voteDistribution[p].seats = +userData[voteDistribution[p].party];
      }else{
        console.warn('party mismatch, make sure all parties are defined in the preset-adjustment' + voteDistribution[p].party);
      }
    }
    deselect();
  }
}

function writeHash(){
  history.replaceState('', '', '#' + voteDistribution.map(function(d){
    return d.party + ':' + d.seats;
  }).join(','));
}

function deselect(){
    d3.selectAll('.preset-adjustment.selected').classed('selected',false);
}

function calculateCoalitions(){
  return coalitions.map(function(d){
    return {
      parties: d,
      singleParty:(d.length === 1),
      seats: d.reduce(function(previous, current){
        return getPartyData(current).seats + previous;
      },0)
    };
  });
}

function makeVoteDistribution(data, property){
  if(!property) property = 'Seats';
  return data.map(function(d){
    return {
      party:d.Party,
      seats:d[property]
    };
  });
}

function getPartyData(p){
  return voteDistribution[partyPosition[p]];
}

function scaledDistribution(data, scale){
  var cumulativePosition = 0;
  for(var i = 0; i<data.length; i++){
    data[i].startPos = cumulativePosition;
    cumulativePosition = cumulativePosition + scale(data[i].seats);
    data[i].endPos = cumulativePosition;
  }
  return data;
}

function calculateVoteDistribution(data, scale){
  return data.map(function(d){
    d.seats = Math.round( scale.invert(d.endPos - d.startPos) );
    return d;
  });
}

function getElementCoords(el){
  el = d3.select(el);
  return {
    x:el.attr("x") + d3.transform(el.attr("transform")).translate[0],
    y:el.attr("y") + d3.transform(el.attr("transform")).translate[1]
  };
}

function setUp(){
  readHash();
  var sliderDim = d3.select('.seats-input').node().getBoundingClientRect();
  var coalitionsDim = d3.select('.coalition-display').node().getBoundingClientRect();

  sliderScale
    .domain([0, 650])
    .range([0, sliderDim.width - (sliderMargin.left + sliderMargin.right)]);

  coalitionScale
    .domain([0, 650])
    .range([0, coalitionsDim.width - (coalitionsMargin.left + coalitionsMargin.right)]);

  controllableParties = d3.select('.seats-input')
    .node()
    .dataset.parties.split(',');

  //sort vote distribution by controllable parties
  var partyOrder = ['ld','c','lab','snp','dup','pc','ukip','sdlp','green','other'];

  voteDistribution = voteDistribution.sort(function(a,b){
    return partyOrder.indexOf(a.party) - partyOrder.indexOf(b.party);
  });

  voteDistribution = scaledDistribution(voteDistribution, sliderScale);
  voteDistribution.forEach(function(d,i){
    partyPosition[d.party]=i;
  });


  d3.select('.seats-input').selectAll('.slider-input').data([1])
    .enter()
    .append('svg')
    .append('g').attr({
      'transform': 'translate( ' + sliderMargin.left + ',' + sliderMargin.top + ' )',
      'id': 'slider'
    });

  d3.select('.seats-input svg')
    .attr({
      'width':sliderDim.width,
      'height':inputHeight,
      'class':'slider-input'
    });

  d3.select('.coalition-display').selectAll('.coalitions-display').data([1])
    .enter()
    .append('svg');

  d3.select('.coalition-display svg').attr({
    'width':coalitionsDim.width,
    'height':inputHeight,
    'class':'coalitions-display'
  });

  //wire up the preset buttons
  d3.selectAll('.preset-adjustment').on('click',function(){
    d3.event.preventDefault();
    deselect();
    d3.select(this).classed('selected',true);
    var d = this.dataset;
    for(var p in voteDistribution){
      if(d[voteDistribution[p].party]){
        voteDistribution[p].seats = +d[voteDistribution[p].party];
      }else{
        console.warn('party mismatch, make sure all parties are defined in the preset-adjustment');
      }
    }
    voteDistribution = scaledDistribution(voteDistribution, sliderScale);
    drawSliderInput();
    drawCoalitions();
    writeHash();
    return false;
  });
}


function drawSliderInput(){

//drag behaviours
  function constrain(x, p1, p2){
    //the x can;'t be less than p1 start or more than p2 end'

    var min = getPartyData(p1).startPos;
    var max = getPartyData(p2).endPos;
    if(p2 === 'snp'){
      var maxSNP = sliderScale(59);
      var SNPEndPos = getPartyData('snp').endPos;
      if(x < SNPEndPos - maxSNP){
        return SNPEndPos - maxSNP;
      }
    }
    return  Math.max(Math.min(max, x), min);
  }

  var drag = d3.behavior.drag();
  drag.origin(function(){
    return getElementCoords(this);
  });

  drag.on('drag', function(d,i) {
    deselect();
    var newPos = constrain(d3.event.x , d.p1, d.p2);
    //set the data to reflect this position
    voteDistribution[partyPosition[d.p1]].endPos = newPos;
    voteDistribution[partyPosition[d.p2]].startPos = newPos;
    //calculate seats
    voteDistribution = calculateVoteDistribution(voteDistribution, sliderScale);
    d3.select(this).attr('transform', function(d,i){
      return 'translate(' + newPos +',0)';
    });
    d3.select('#slider').call(drawSliderBars);
    drawCoalitions();
    writeHash();
  });

//bars
  d3.select('#slider').call(drawSliderBars);

//handles
  var handleEnter = d3.select('#slider')
    .selectAll('.slider-input__handle').data( handlesData(controllableParties) )
    .enter()
    .append('g')
    .attr({
      'class':'slider-input__handle',
      'data-p1':function(d){ return d.p1; },
      'data-p2':function(d){ return d.p2; },
      'transform':function(d){
        return 'translate(' + getPartyData(d.p1).endPos + ',0)';
      }
    }).call(drag);



  handleEnter
    .append('use')
    .attr({
      'xlink:href':'#slider-handle-graphic',
      'class':'interactive-input',
      'transform':'translate(-'+handleWidth/2+',' + (barHeight) +')'
    });

  handleEnter
    .append('rect')
    .attr({
      'x':0,
      'y':0,
      'width':handleWidth,
      'height':barHeight*2,
      'class':'interactive-input',
      'fill':'#000',
      'fill-opacity':0,
      'transform':'translate(-'+handleWidth/2+',' + (barHeight) +')'
    });

  d3.select('#slider')
    .selectAll('.slider-input__handle')
    .attr('transform',function(d){
      return 'translate(' + getPartyData(d.p1).endPos + ',0)';
    });
}

function drawSliderBars(parent){
  var lineHeight = 19;
  var barGroup = parent.selectAll('.slider-input__bar').data(voteDistribution)
    .enter().append('g')
    .attr({
      'class':function(d){
        return 'slider-input__bar ' + parties.className(d.party)+'-area';
      },
      'transform':function(d){
        return 'translate('+d.startPos+',0)';
      }
    });

  barGroup.append('rect')
    .attr({
      width:function(d){
        return d.endPos - d.startPos;
      },
      height:barHeight
    });

  var label = barGroup.append('text')
    .attr({
      'class':function(d){
        if(controllableParties.indexOf(d.party)<0) { return 'slider-input__label hidden';}
        return 'slider-input__label';
      },
      'y':lineHeight-3
    });

  label.append('tspan')
    .attr({
      'class':'slider-input__label__party',
      'x':4
    })
    .text(function(d){
      return parties.shortName(d.party);
    });

  label.append('tspan')
    .attr({
      'class':'slider-input__label__seats',
      'x':4,
      'dy':lineHeight
      })
    .text(function(d){
      return d.seats;
    });

  parent
    .selectAll('.slider-input__bar')
      .attr({
        'transform':function(d){
          return 'translate('+d.startPos+',0)';
        }
      });

  parent.selectAll('.slider-input__bar rect')
    .attr({
      width:function(d){
        return d.endPos - d.startPos;
      }
    });

  parent.selectAll('.slider-input__label__party').text(function(d){
    return parties.shortName(d.party);
  });

  parent.selectAll('.slider-input__label__seats').text(function(d){
    return d.seats;
  });

  return parent;
}


function handlesData(parties){
  var h = [];
  for(var i= 0; i<parties.length-1 ; i++){
    h.push({
      p1: parties[i],
      p2: parties[i+1]
    });
  }
  return h;
}

function coalitionData(coalition){
  var scaled = [];
  var cumulative = 0;
  coalition.forEach(function(d,i){
    var s = {};
    s.party = d;
    s.startPos = cumulative;
    cumulative += coalitionScale(getPartyData(d).seats);
    s.endPos = cumulative;
    scaled.push(s);
  });
  return scaled;
}

function drawCoalitions(){
  var majority = 325;
  var data = calculateCoalitions();
  var barSpacing = 10;
  var barHeight = 14;
  var chartHeight = coalitions.length*(barHeight+barSpacing) + coalitionsMargin.top + coalitionsMargin.bottom;
  function markerScale(d){
    return coalitionScale(d.value) + coalitionsMargin.left;
  }

  var markerGroup = d3.select('.coalition-display svg').attr({
    height:chartHeight
  }).selectAll('.coalition-display__majority-marker').data([{value:majority,label:'Majority ('+majority+')'}])
    .enter();

  markerGroup.append('line')
    .attr({
      x1:markerScale,
      y1:0,
      x2:markerScale,
      y2:chartHeight,
      'shape-rendering':'crispEdges',
      'class':'coalition-display__majority-marker'
    });

  markerGroup.append('text')
    .attr({
      'x':function(d){ return markerScale(d)+4; },
      'y':chartHeight - coalitionsMargin.bottom + 13,
      'class':'axis-label'
    })
    .text(function(d){ return d.label; });

  d3.selectAll('.coalition-display__majority-marker').attr({
    x1:markerScale,
    y1:0,
    x2:markerScale,
    y2:chartHeight,
    'class':'coalition-display__majority-marker'
  });

  d3.selectAll('.axis-label').attr({
    'x':function(d){ return markerScale(d)+4; },
    'y':chartHeight - coalitionsMargin.bottom + 13
  });

  var enterGroups = d3.select('.coalitions-display').selectAll('.party-grouping')
    .data(data, function(d){ return d.parties.join(','); })
      .enter()
      .append('g')
        .attr({
          'class':function(d){
            var viable='';
            if(d.seats > majority){ viable = 'viable'; }
            return 'party-grouping ' + viable;
          },
          'transform':function(d,i){
            return 'translate(0,' +(coalitionsMargin.top + i*(barHeight+barSpacing))+ ')';
          }
        });

  d3.select('.coalitions-display').selectAll('.party-grouping').attr('class',function(d){
    var viable='';
    if(d.seats > majority){ viable = 'viable'; }
    return 'party-grouping ' + viable;
  });

  enterGroups.append('text')
    .attr({
      'transform':'translate('+(coalitionsMargin.left - 3)+','+barHeight+')',
      'text-anchor':'end'
    })
    .text(function(d){ return d.parties.map(parties.shortName).join(', ')});

  enterGroups.append('g').attr({
    'class':'party-grouping__bar-stack',
    'transform':'translate('+coalitionsMargin.left+','+barHeight+')'
  });

  d3.selectAll('.party-grouping__bar-stack').data(data).each(function(d){
    var parent = d3.select(this);
    var textDataJoin = parent.selectAll('text').data([d]);
    textDataJoin.enter().append('text');
    parent.selectAll('text')
      .attr('transform',function(d){ return 'translate('+(coalitionScale(d.seats)+3)+',0)'; })
      .text(function(d){ return d.seats });

    var scaledCoalitionData = coalitionData(d.parties);

    parent.selectAll('.party-grouping__bar-stack__party')
      .data( scaledCoalitionData, function(d){ return d.party; } ).enter()
      .append('rect')
        .attr({
          'class':function(d){
            return 'party-grouping__bar-stack__party ' + parties.className(d.party) + '-area borderless';
          }
        });

    parent.selectAll('.party-grouping__bar-stack__party')
      .attr({
        x: function(d){ return d.startPos; },
        y: -barHeight,
        width: function(d){ return d.endPos - d.startPos; },
        height: barHeight
      });
  });
}

var resize = debounce(function(e) {
  setUp();
  drawSliderInput();
  drawCoalitions();
}, 50);
window.addEventListener("resize", resize, false);
