'use strict';

var d3 = require('d3');
var topojson = require('topojson');

function locatorMap(){
  var height = 300,
  width = 200,
  map,
  locations,
  locatorProjection = d3.geo.albers() //standard UK
    .center([-2.5, 55.4])
    .rotate([0, 0])
    .parallels([50, 60])
    .scale(1500)
    .translate([width / 2, height / 2]),
  path = d3.geo.path().projection(locatorProjection);

  function locator(g){
    var svg = g.append('div').attr('class','locator-container')
      .append('svg')
      .attr({
        viewBox:'0 0 ' + width + ' ' + height + '',
        width:width,
        height:height
      });

    if(map){
      svg.selectAll(".subunit")
        .data(topojson.feature(map, map.objects.subunits).features)
        .enter()
        .append("path")
        .attr("class", function(d) { return "subunit region-" + d.id.toLowerCase(); })
        .attr("d", path);

      svg.append("path")
        .datum(topojson.mesh(map, map.objects.subunits, function(a, b) { return a !== b && a.id !== "IRL"; }))
        .attr("d", path)
        .attr("class", "subunit-boundary");

      svg.append("path")
        .datum(topojson.mesh(map, map.objects.subunits, function(a, b) { return a === b && a.id === "IRL"; }))
        .attr("d", path)
        .attr("class", "subunit-boundary IRL");
    }

    if(locations){
      svg.selectAll('circle')
        .data(locations)
        .enter()
        .append('circle')
        .attr({
          'class':function(d){
            return 'constituency-point ' + (d.holderpredicted);
          },
          'r':2,
          'transform':function(d){
            return 'translate(' + locatorProjection(d.coords) + ')';}
        });
    }
  }

  locator.locations = function(a){
    locations = a;
    return locator;
  };

  locator.width = function(x){
    width = x;
    return locator;
  };

  locator.height = function(x){
    width = x;
    return locator;
  };

  locator.map = function(m){
    map = m;
    return locator;
  };

  return locator;
}



module.exports = locatorMap;
