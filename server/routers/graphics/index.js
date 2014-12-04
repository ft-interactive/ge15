var Router = require('koa-router');
var koa = require('koa');
var svg = require('../../graphics/svg');

var geoData = require('../../data/geo-data');
var resultData = require('../../data/results');
//var constituencySummary = resultData.constituencies();

var parties = require('../../data/parties');

module.exports = function() {
  var router = koa();
  router.use(Router(router));

  router.get('slope', '/slope/:slopeconfig/:constituency', slopeConfig, drawSlope);
//TODO specify id as an optinal parameter
  router.get('map-area','/map/:areatype/:mapconfig/:id', mapConfig, drawMap);
  router.get('map-general','/map/:areatype/:mapconfig/', mapConfig, drawMap);

  return router;
};


//map stuff

var mapOptions = require('../../graphics/map-config');


var mapConfig = function* (next){
	if(mapOptions[this.params.areatype][this.params.mapconfig]) {
		this.plotConfig = mapOptions[this.params.areatype][this.params.mapconfig];
	}else{
		this.plotConfig = mapOptions[this.params.areatype]['small'];
	}
	this.plotConfig.geoJSON = geoData[this.params.areatype](this.params.id, this.plotConfig.detail);
	yield next;
}

var drawMap = function* (next){
	this.body = yield svg('map', this.plotConfig);
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
  	var constituencyResults = resultData.constituency(this.params.constituency) // getResultsData(this.params.constituency);

  	this.type = 'image/svg+xml';
  	this.plotConfig.name = constituencyResults.name;
  	this.plotConfig.slopes = this.plotConfig.layout( constituencyResults.parties );
  	this.body = yield svg('slope', this.plotConfig);
  	yield next;
}
