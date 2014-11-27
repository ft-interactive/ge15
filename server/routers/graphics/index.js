var Router = require('koa-router');
var koa = require('koa');
var svg = require('../../graphics/svg');

var geoData = require('../../data/geo-data');


module.exports = function() {
  var router = koa();
  router.use(Router(router));
  router.get('slope', '/slope/:slopeconfig/:constituency', slopeConfig, drawSlope);

  router.get('constituency-map','/map/constituency/:constituency', mapData, drawMap);

  return router;
};



//map stuff

var mapData = function* (next){
	this.geoData = {
		height: 500,
		width: 500,
		margin: {top:20, left:20, bottom:20, right:20},
		geoJSON: geoData.constituency(this.params.constituency)
	};
	yield next;
}

var drawMap = function* (next){
	this.body = yield svg('map', this.geoData);
	yield next;
}



//Slope chart stuff

var slopeOptions = require('../../graphics/slope-config');

var slopeConfig = function* (next){
	if(slopeOptions[this.params.slopeconfig]) {
		this.plotConfig = slopeOptions[this.params.slopeconfig];
	}else{
		this.plotConfig = slopeOptions['small'];
	}
	yield next;
}

var drawSlope = function* (next){
  	var constituencyResults = getResultsData(this.params.constituency);

  	this.type = 'image/svg+xml';
  	this.plotConfig.name = constituencyResults.name;
  	this.plotConfig.slopes = this.plotConfig.layout( constituencyResults.parties );
  	this.body = yield svg('slope', this.plotConfig);
  	yield next;
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