'use strict';
var d3 = require('d3');

module.exports = function (selection, data, options){

	selection
		.append('svg').attr({
			xmlns:'http://www.w3.org/2000/svg',
			width:500,
			height:500
		}).selectAll('text').data(data.parties).enter()
			.append('g').attr('transform',function(d,i){ return 'translate(20,'+ (20*i +20) +')'})
			.append('text')
				.text(function(d){
					return d.name;
				})
				.attr({fill:'#000'});
}