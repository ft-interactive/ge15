'use strict';

var slopeLayout = require('./slope-layout').layout;
var parties = require('../data/parties');

var domain = [0,100];

function start(d){
	return d.pct2005;
}

function end(d){
	return d.pct2010;
}

function fill(d){ 
	return parties[d.name].color; 
}

function stroke(d){ 
	return parties[d.name].secondarycolor; 
}

module.exports = {
	small:{
		width:100,
		height:100,
		margin:{top:10,left:10,bottom:10,right:10},
		dotRadius:3,
		layout:slopeLayout()
			.domain( domain )
			.range( [80,0] )
			.start( start )
			.end( end )
			.attr({
				'fill':fill,
				'stroke':stroke
			})
	},
	medium:{
		width:200,
		height:200,
		margin:{top:10,left:10,bottom:10,right:30},
		dotRadius:3,
		layout:slopeLayout()
			.domain( domain )
			.range( [180,0] )
			.start( start )
			.end( end )
			.attr({
				'fill':fill,
				'stroke':stroke,
				'label':function(d){ return d.pct2010 + '%'; }
			})
	},
	large:{
		width:400,
		height:400,
		margin:{top:10,left:10,bottom:10,right:100},
		dotRadius:5,
		layout:slopeLayout()
			.domain( domain )
			.range( [380,0] )
			.start( start )
			.end( end )
			.attr({
				'fill':fill,
				'stroke':stroke,
				'label':function(d){ return d.pct2010 + '% ' + parties[d.name].ftabbrv; }
			})
	}
};
