var Router = require('koa-router');
var koa = require('koa');
var svg = require('../../graphics/svg');
var slopeLayout = require('../../graphics/slope-layout')();

//TODO, make these set-able (explicitly via the route or a series of pre defined configs (Large, medium, XL etc)...?)
var width = 200,
	height = 200,
	margin = {top:10,bottom:10,left:10,right:10};

slopeLayout.start(function(d){
	return d.pct2005;
});

slopeLayout.end(function(d){
	return d.pct2010;
});

slopeLayout.domain( [0,100] );
slopeLayout.range( [200,0] );

module.exports = function() {
  var router = koa();
  router.use(Router(router));

  router.get('slope', '/slope/:constituency', function* (next){
  	this.type = 'image/svg+xml';
  	var constituencyResults = getResultsData(this.params.constituency);
  	var plotData = {
  		name: constituencyResults.name,
  		labels:function(d){ return d.data.party; },
  		colors:function(d){ return colorScale(d.data.party); },
  		slopes: slopeLayout( constituencyResults.parties ),
  		width: width,
  		height: height,
  		margin: margin
  	};
  	this.body = yield svg('slope', constituencyResults);
  	yield next;
  });

  return router;
};


//TODO factor out colour scales
var d3 = require('d3');
var colorScale = d3.scale.ordinal()
	.range(['#F00','#00F','#FA0','#A0F'])
	.domain(['Labour','Conservative','Liberal Democrat','UKIP']);

//TODO replace this dummy data thing
function getResultsData(constituencyID){
	return {
		name:"Test Place",
		id:constituencyID,
		results:[
			{year:2005, winner:'Labour'},
			{year:2010, winner:'Conservative'}
		],
		parties:[
			{name:'Labour', pct2005:'46', pct2010:'37'},
			{name:'Conservative', pct2005:'43', pct2010:'51'},
			{name:'Liberal Democrat', pct2005:'7', pct2010:'8'},
			{name:'UKIP', pct2005:'0', pct2010:'4'}
		]
	}
}