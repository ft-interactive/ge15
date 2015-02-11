'use strict';

var d3 = require('d3');
var topojson = require('topojson');

function locatorMap() {
  var height = 300;
  var width = 200;
  var map;
  var locations;
  var locatorProjection;
  var path;
  var dirty = true;

  function cleanPath() {
    if (!dirty) return;

    locatorProjection = d3.geo.albers() //standard UK
      .center([-4.1, 55.2])
      .rotate([0, 0])
      .parallels([50, 60])
      .scale(height / width * 850)
      .translate([Math.floor(width / 2), Math.floor(height / 2)]);
    path = d3.geo.path().projection(locatorProjection);
    dirty = false;
  }

  function locator(g) {

    cleanPath();

    var svg = g.append('svg')
      .attr({
        width:width,
        height:height
      });

    if(map) {
      svg.selectAll('.subunit')
        .data(topojson.feature(map, map.objects.subunits).features)
        .enter()
        .append('path')
        .attr('class', function(d) {
          return 'subunit region-' + d.id.toLowerCase();
        })
        .attr('d', path);
    }

    if (locations) {
      svg.selectAll('circle')
        .data(locations)
        .enter()
        .append('circle')
        .attr({
          class: function(d) {
            return 'constituency-point ' + (d.holderpredicted);
          },
          'r': 3,
          transform: function(d) {
            return 'translate(' + locatorProjection(d.coords) + ')';
          }
        });
    }
  }

  locator.locations = function(a) {
    dirty = true;
    locations = a;
    return locator;
  };

  locator.width = function(x) {
    dirty = true;
    width = x;
    return locator;
  };

  locator.height = function(x) {
    dirty = true;
    height = x;
    return locator;
  };

  locator.map = function(m) {
    dirty = true;
    map = m;
    return locator;
  };

  return locator;
}

module.exports = locatorMap;
