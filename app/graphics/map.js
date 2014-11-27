'use strict';

var d3 = require('d3');


//TODO .. fix this projection so it's not centered on Wales




module.exports = function (selection, data, options){
	console.log('a map');
	console.log('map data ', data.geoJSON);

	var projection = d3.geo.albers()
	    .center([-3.5, 52.54])
	    .rotate([0, 0])
	    .parallels([50, 60])
	    .scale(6000)
	    .translate([data.width / 2, data.height / 2]);

	var path = d3.geo.path()
	    .projection(projection);

	selection
		.append('svg').attr({
			xmlns:'http://www.w3.org/2000/svg',
			width:data.width,
			height:data.height
		}).selectAll('path').data(data.geoJSON.features).enter()
			.append('path')
			.attr({
				'd':path,
					'id':function(d){ return d.id; }
				});
}