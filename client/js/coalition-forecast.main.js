'use strict';

/* global coalitions */

var d3 = require('d3');
var parties = require('uk-political-parties');

var primaryPieParties = ['lab','c'];
var secondaryPartyPies = ['snp', 'ld','ukip','dup','green','pc'];

var margin = { top: 0, right: 0, bottom: 0, left: 0 },
  width = 600 - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom;

var pieLayout = d3.layout.pie()
  .sort(null)
  .value(function(d){
    return d.probability;
  });

var pieData = pieLayout(coalitions);
var partyCumulativeProbabilities = {};

coalitions.forEach(function(c){
  c.parties.forEach(function(p){
    if(!partyCumulativeProbabilities[p]) partyCumulativeProbabilities[p] = 0;
    partyCumulativeProbabilities[p] += c.probability;
  });
});

//HEADLINE
var headline = d3.select('#main-visualisation').append('div')
  .attr({'class':'pie-headline o-grid-row'});

headline.append('div')
  .attr({'class':parties.className('c'),'data-o-grid-colspan':'6'})
    .text(parties.fullName('c') + ' ' + d3.round(partyCumulativeProbabilities['c'], 1)+'%');

headline.append('div')
  .attr({'class':parties.className('lab'),'data-o-grid-colspan':'6'})
    .text(parties.fullName('lab') + ' ' + d3.round(partyCumulativeProbabilities['lab'], 1) +'%');


//MAIN PIE CHART
var svg = d3.select('#main-visualisation').append('svg')
  .attr('width', '100%')
  .attr('height', '100%')
  .attr('viewBox', '0 0 '+(width + (margin.left + margin.right))+' '+(height + (margin.top + margin.bottom))+'')
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

svg.selectAll('g.main-segment')
  .data(pieData)
  .enter().call(pie,{
      parties:primaryPieParties,
      width:width,
      height:height
    });

//PARTY BY PARTY
d3.select('#sub-visualisation')
  .selectAll('div.individual-party')
    .data(secondaryPartyPies)
  .enter()
    .append('div')
    .attr({
      'class':'sub-pie-container',
      'data-o-grid-colspan':'4'
      })
    .each(function(d){
    var container = d3.select(this);
    container.append('div').attr('class',function(d){
        return d.toLowerCase() + ' sub-pie-header';
      }).html(function(d){
        return parties.shortName(d) +' <b>' + d3.round(partyCumulativeProbabilities[d],1)+ '%</b>';
      });
    container.append('svg')
      .attr({
        width:'50%',
        height:'50%',
        viewBox:'0 0 100 100'
      })
        .selectAll('g.sub-segment')
          .data(pieData).enter().call(pie,
          {
            parties:[d],
            width:100,
            height:100,
            radius:50,
            labelThreshold:100
          });
  });


function pie(selection, opts){
  var options = {
    parties:['lab','c'],
    labelThreshold:7,
    radius:100,
    labelOffset:5,
    width:600,
    height:200
  };
  for(var o in opts){
    if(opts.hasOwnProperty(o)) options[o] = opts[o];
  }


  var arc = d3.svg.arc()
    .outerRadius(options.radius - 10)
    .innerRadius(options.radius/3);

  var segment = selection.append('g')
    .attr({
      'class':'main-segment',
      'transform':'translate('+options.width/2+','+options.height/2+')'
    });

  segment.append('path')
    .attr({
      'd': arc,
      'class':function(d){
        var classString = 'pie-segment ';
        d.data.parties.forEach(function(p){
          if(options.parties.indexOf(p)>-1){
            classString += ' ' +parties.className(p);
          }
        });
        return classString;
      }
    });

    segment.append('text')
      .attr({
        'id':function(d){
          return toID(d.data.name);
        },
        'transform':function(d){
          var mid = midAngle(d);
          var pos = getXY(mid,options.radius+options.labelOffset);

          return 'translate(' + pos.x + ',' + pos.y + ')';
        },
        'text-anchor':function(d){
          if(midAngle(d)>Math.PI){
            return 'end';
          }
          return 'start';
        }
      })
      .filter(function(d){
        return (d.data.probability > options.labelThreshold);
      })
      .call(segmentLabel);
}

function segmentLabel(g){
  var lineHeight = 1;
  g.each(function(t){
    var lines = t.data.name.split(/\/(.+)/).filter(function(s){ return (s!=='')});
    lines[0] = t.data.probability + '% ' +lines[0];
    if(lines[1]) lines[1] = '/' + lines[1];
    d3.select(this).selectAll('tspan')
      .data(lines)
      .enter()
        .append('tspan')
        .attr({
            dy:function(d,i){return (i*lineHeight) + 'em'; },
            x:0
          })
          .text( function(s,i){ return s; } );
  });
}

function midAngle(d){
  return d.startAngle + (d.endAngle - d.startAngle)/2;
}

function getXY(angle, radius){
  angle = -angle+Math.PI;
  return{
    x:radius * Math.sin(angle),
    y:radius * Math.cos(angle)
  };
}

function toID(s){
  return s.replace(/[\W\s]/g,'-');
}
