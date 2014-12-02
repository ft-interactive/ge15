'use strict';

var d3 = require('d3');


//styling functions

function fill(d){
	return 'none';
}

function stroke(d){
	if(!d.properties) return '#999';

	if(d.properties.type == 'primary'){
		return '#000';
	}else if(d.properties.type == 'regionalBoundary'){
		return '#F00'
	}else if(d.properties.type == 'minor'){
		return 'none';
	}else if(d.properties.type == 'coast'){
		return '#0FF';
	}
	return '#999';
}

function strokeWidth(d){
	if(!d.properties) return '1';

	if(d.properties.type == 'primary'){
		return '2';
	}else if(d.properties.type == 'regionalBoundary'){
		return '4'
	}else if(d.properties.type == 'minor'){
		return '0.5';
	}else if(d.properties.type == 'coast'){
		return '1';
	}
	return 1;
}

function strokeDasharray(d){
	if(!d.properties) return [];
	if(d.properties.type == 'regionalBoundary'){
		return [4,4];
	}
	return [];
}

//end styling functions

function getBounds(features, path){
	//TODO get this working n the case of multiple features
	var bounds = path.bounds(features[0]);
	if(features.length != 1){
		features.forEach(function(feature){
			var featureBounds = path.bounds(feature);
			bounds[0][0] = Math.min(bounds[0][0], featureBounds[0][0]);
			bounds[0][1] = Math.min(bounds[0][1], featureBounds[0][1]);
			bounds[1][0] = Math.max(bounds[1][0], featureBounds[1][0]);
			bounds[1][1] = Math.max(bounds[1][1], featureBounds[1][1]);
		});
	}
	return bounds;
}

module.exports = function (selection, data, options){
	var plotWidth = data.width - (data.margin.left + data.margin.right);
	var plotHeight = data.height - (data.margin.top + data.margin.bottom);

//TODO .. fix this projection so it's not centered on Wales
	var projection = d3.geo.albers()
	    .center([-1.7, 54.1])
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
			'stroke':stroke,
			'stroke-linejoin':'round'
		});


	var focus = data.geoJSON.features.filter(function(feature){
		if(!feature.properties) return false;
		return (feature.properties.focus);
	})

	var bounds = getBounds(focus, path),
		dx = bounds[1][0] - bounds[0][0],
		dy = bounds[1][1] - bounds[0][1],
		x = (bounds[0][0] + bounds[1][0]) / 2,
		y = (bounds[0][1] + bounds[1][1]) / 2,
		scale = .9 / Math.max(dx / plotWidth, dy / plotHeight),
		translate = [plotWidth / 2 - scale * x, plotHeight / 2 - scale * y];

	frame.select('g').attr({
		'transform':'translate(' + translate + ') scale(' + scale + ')' })
		.selectAll('path')
		.style('stroke-width', function(d){
			return strokeWidth(d)/scale;
		})
		.style('stroke-dasharray', function(d){
			return strokeDasharray(d).map(function(e){ return e/scale }).join(',');
		});

}