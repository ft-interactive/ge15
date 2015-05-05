'use strict';

var d3 = require('d3');
var debounce = require('lodash/function/debounce');

module.exports = function(){
  //get the config-details
  d3.selectAll('.figure__body.slope-graphic').call(function(parent){
    var svg = parent.select('svg');
    var config = svg.node().dataset;

    var margin = {
      top:+config['margintop'],
      left:+config['marginleft'],
      bottom:+config['marginbottom'],
      right:+config['marginright']
    };
    var domain = [0, config.domain];

    //work out the current scale
    // var verticalScale = d3.scale.linear()
    //   .domain([0, config.domain])
    //   .range([height-(margin.bottom+margin.top), 0]);

    //join the data to the page elements
    var data = [];
    svg.selectAll('g.slope').each(function(){
      var d = this.dataset;
      data.push({
        start:+d.start,
        end:+d.end,
        party:d.party,
        label:d.label
      });
    }).data(data);

//check for overlapping labels
    svg
      .call(resizeChart, parent.node().getBoundingClientRect(), margin, domain)
      .call(rejigLabels);

    var resize = debounce(function(e) {
      //measure the container
      //rescale the chart
      console.log('resize');
      svg
        .call(resizeChart, parent.node().getBoundingClientRect(), margin, domain)
        .call(rejigLabels);
    }, 50);
    window.addEventListener('resize', resize, false);

    return parent;
  });
};

function resizeChart(parent, bounds, margin, dataDomain){
  console.log('range height', margin.top+margin.bottom);

  var scale = d3.scale.linear()
    .domain(dataDomain)
    .range([bounds.height-(margin.top+margin.bottom),0]);

  parent.attr({
    width:bounds.width
  });

  parent.selectAll('g.slope')
    .each(function(d){
      console.log(d);
      //move the lines
      var currentSlope = d3.select(this);
      currentSlope.select('line').attr({
        x1:0,
        y1:scale(d.start),
        x2:bounds.width-margin.right,
        y2:scale(d.end)
      });
      //move the labels
      currentSlope
        .select('text')
          .attr('transform','translate('+( bounds.width - margin.right + 5)+','+(scale( d.end ) + 5)+')')
          .classed('slope-graphic__slope-text',(bounds.width>300))
          .classed('slope-graphic__slope-text-small',(bounds.width<=300));

      currentSlope
        .select('.slope-graphic__slope-point-start')
          .attr({
            cx:0,
            cy:scale( d.start )
          });
      currentSlope
        .select('.slope-graphic__slope-point-end')
          .attr({
            cx:bounds.width - margin.right,
            cy:scale( d.end )
          });
      //check their class... i.e. should they have larger font?
      //move the circles
    });
  return parent;
}

function rejigLabels(parent){
  console.log('labels');
  var textAreas = parent.selectAll('text');

  textAreas.each(function(d,i){
    //first always stays in place, shift otehrs down as appropriate
    if(i>0){
      var overlap = yOverlap( this, textAreas[0][i-1] );
      if(overlap > 0){
        var currentTransform = getTranslate(this);
        d3.select(this).attr('transform','translate('+currentTransform.x+','+(currentTransform.y+overlap)+')');
      }
    }
  });
  return parent;
}

function getTranslate(el){
  var coords  = parseTransform(d3.select(el).attr('transform')).translate;
  return{
    x:+coords[0],
    y:+coords[1]
  };
}

function parseTransform (a){
  var b={};
  a = a.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?)+\))+/g);
  for (var i in a){
    if(a.hasOwnProperty(i)){
      var c = a[i].match(/[\w\.\-]+/g);
      b[c.shift()] = c;
    }
  }
  return b;
}

function yOverlap(elementA, elementB){
  var a = elementA.getBoundingClientRect(),
  b = elementB.getBoundingClientRect();
  return b.bottom - a.top;
}
