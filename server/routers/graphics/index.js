var Router = require('koa-router');
var koa = require('koa');
var svg = require('../../graphics/svg');

var geoData = require('../../data/geo-data');
var resultData = require('../../data/results');

module.exports = function() {
  var router = koa();
  router.use(Router(router));

  router.get('slope', '/slope/:slopeconfig/:constituency', slopeConfig, drawSlope);
  router.get('constituency-map','/map/constituency/:mapconfig/:constituency', constituencyMapConfig, drawMap);
  router.get('constituency-map','/map/uk/:mapconfig', UKMapConfig, drawMap);

  return router;
};


//map stuff

var mapOptions = {
	'small': {
		height: 100,
		width: 100,
		margin: {top:5, left:5, bottom:5, right:5},
		detail:'medium'
	},
	'medium': {
		height: 600,
		width: 600,
		margin: {top:20, left:20, bottom:20, right:20},
		detail:'medium'
	},
	'large': {
		height: 1000,
		width: 1000,
		margin: {top:50, left:50, bottom:50, right:50},
		detail:'high'
	}
};

var constituencyMapConfig = function* (next){
	if(mapOptions[this.params.mapconfig]) {
		this.plotConfig = mapOptions[this.params.mapconfig];
	}else{
		this.plotConfig = mapOptions['small'];
	}
	this.plotConfig.geoJSON = geoData.constituency(this.params.constituency, this.plotConfig.detail);
	yield next;
}

var UKMapConfig = function* (next){
	if(mapOptions[this.params.mapconfig]) {
		this.plotConfig = mapOptions[this.params.mapconfig];
	}else{
		this.plotConfig = mapOptions['small'];
	}
	this.plotConfig.geoJSON = geoData.uk();
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
