'use strict';
var d3 = require('d3');

module.exports = function (selection, data){
	var plotWidth = data.width - (data.margin.left + data.margin.right);
	var plotHeight = data.height - (data.margin.top + data.margin.bottom);
	var radius = data.dotRadius;

	var svg = selection
		.append('svg').attr({
			xmlns:'http://www.w3.org/2000/svg',
			width:data.width,
			height:data.height
		}).append('g')
			.attr('transform','translate('+data.margin.left+','+data.margin.top+')')


	var slope = svg.selectAll('g').data(data.slopes).enter()
		.append('g');

	slope.append('line').attr({
		'stroke': function(d){ return d.stroke; },
		'x1': 0,
		'y1': function(d){ return d.slopeStart; },
		'x2': plotWidth,
		'y2': function(d){ return d.slopeEnd; }
	});

	//start point
	slope.append('circle').attr({
		'fill': function(d){ return d.fill; },
		'r':radius,
		'cx':0,
		'cy':function(d){ return d.slopeStart; }
	});

	//end point
	slope.append('circle').attr({
		'fill': function(d){ return d.fill; },
		'r':radius,
		'cx':plotWidth,
		'cy':function(d){ return d.slopeEnd; }
	});

	slope.append('text').attr({
		x:plotWidth+5,
		y:function(d){ return d.slopeEnd + 4; },
		'font-family':'BentonSans,sans-serif',
		'font-size':10,
		'fill':'#000',
		'fill-opacity':0.7
	}).text(function(d){ return d.label; });			
}