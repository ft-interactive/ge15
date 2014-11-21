'use strict';
var d3 = require('d3');

module.exports = function (selection, data, options){
	selection
		.append('svg').attr({
			xmlns:'http://www.w3.org/2000/svg',
			width:500,
			height:500
		}).selectAll('text').data(data).enter()
			.append('g').attr('transform','translate(20,20)')
			.append('text')
				.text(function(d){ return d; })
				.attr({fill:'#000'});
}