'use strict';

var slopeLayout = require('../../graphics/slope-layout').layout;
var parties = require('../../data/parties');

var domain = [0,100];


module.exports = {
	small:{
		width:200,
		height:200,
		margins:{top:10,left:10,bottom:10,right:10},
		layout:slopeLayout()
			.domain( domain )
			.range( [180,0] )
			.start( function(d){
				return d.pct2005;
			})
			.end( function(d){
				return d.pct2010;
			})
			.attr({
				'fill':function(d){ return parties[d.name].primarycolor; },
				'stroke':function(d){ return parties[d.name].secondarycolor; },
				'label':function(d){ return d.pct2010 + '%'; }
			})
			.dotRadius:3;
	},
	medium:{},
	large:{}
};