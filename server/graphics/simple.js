'use strict';
var d3 = require('d3');

module.exports = function (selection, data, options){
	selection
		.append('svg').attr({
			width:500,
			height:500
		}).selectAll('text').data(data).enter()
			.append('text').text(function(d){ return d; });

}
