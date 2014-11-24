var Router = require('koa-router');
var koa = require('koa');
var svg = require('../../graphics/svg');
var parties = require('../../data/parties');
var slopeConfig = require('../../graphics/slope-config');
var slopeLayout = require('../../graphics/slope-layout').layout();

//TODO, make these set-able (explicitly via the route or a series of pre defined configs (Large, medium, XL etc)...?)
var width = 200,
	height = 200,
	margin = {top:10,bottom:10,left:10,right:50}
	plotHeight = height - (margin.top + margin.bottom),
	plotWidth = width - (margin.left + margin.right);

slopeLayout
	.start(function(d){
		return d.pct2005;
	})
	.end(function(d){
		return d.pct2010;
	})
	.domain( [0,100] )
	.range( [plotHeight,0] )
	.attr({
		'fill':function(d){ return parties[d.name].primarycolor; },
		'stroke':function(d){ return parties[d.name].secondarycolor; },
		'label':function(d){ return d.pct2010 + '%'; }
	});

module.exports = function() {
  var router = koa();
  router.use(Router(router));

  router.get('slope', '/slope/:slopeconfig/:constituency', slopeConfig, drawSlope);

  return router;
};

var slopeConfig = function* (next){
	console.log(this.params.slopeconfig);
	this.plotConfig = 'hiya';
	yield next;
}

var drawSlope = function* (next){
  	this.type = 'image/svg+xml';
  	var constituencyResults = getResultsData(this.params.constituency);
  	var plotConfig = this.plotConfig;
  	console.log(plotConfig);
  	var plotData = {
  		name: constituencyResults.name,
  		slopes: slopeLayout( constituencyResults.parties ),
  		width: width,
  		height: height,
  		margin: margin,
  		dotRadius: 3
  	};
  	this.body = yield svg('slope', plotData);
  	yield next;
}

//slope configs .. TODO: maybe put this somewhere else?

slopeStyle = {
	'small':{
		width:200,
		height:200,
		margin:{top:10,left:10,bottom:10,right:10}
	},
	'medium':{},
	'large':{}
}

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
			{name:'UK Independence Party', pct2005:'0', pct2010:'4'}
		]
	}
}