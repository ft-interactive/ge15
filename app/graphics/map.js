'use strict';

var d3 = require('d3');




function fill(){
	return 'none';
}

function stroke(){
	return '#000';
}

function getBounds(features, path){
	//TODO get this working n the case of multiple features
	return path.bounds(features[0]);
}

module.exports = function (selection, data, options){
	console.log('a map');
	console.log('map data ', data.geoJSON);

	var plotWidth = data.width - (data.margin.left + data.margin.right);
	var plotHeight = data.height - (data.margin.top + data.margin.bottom);

//TODO .. fix this projection so it's not centered on Wales
	var projection = d3.geo.albers()
	    .center([-3.5, 52.54])
	    .rotate([0, 0])
	    .parallels([50, 60])
	    .scale(6000)
	    .translate([plotWidth / 2, plotHeight / 2]);

	var path = d3.geo.path()
	    .projection(projection);

	var frame = selection
		.append('svg').attr({
			xmlns:'http://www.w3.org/2000/svg',
			width:data.width,
			height:data.height
		}).append('g').attr('transform','translate('+data.margin.left+','+data.margin.top+')');

	frame.append('g').attr('class','electoral-map').selectAll('path').data(data.geoJSON.features).enter()
		.append('path')
		.attr({
			'd':path,
			'id':function(d){ return d.id; },
			'fill':fill,
			'stroke':stroke
		});

	var bounds = getBounds(data.geoJSON.features, path),
		dx = bounds[1][0] - bounds[0][0],
		dy = bounds[1][1] - bounds[0][1],
		x = (bounds[0][0] + bounds[1][0]) / 2,
		y = (bounds[0][1] + bounds[1][1]) / 2,
		scale = .9 / Math.max(dx / plotWidth, dy / plotHeight),
		translate = [plotWidth / 2 - scale * x, plotHeight / 2 - scale * y];

	frame.select('g').attr({
		'transform':'translate(' + translate + ') scale(' + scale + ')'
	}).style('stroke-width',1/scale);

}