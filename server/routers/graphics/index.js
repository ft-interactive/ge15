var Router = require('koa-router');
var koa = require('koa');
var svg = require('../../graphics/svg');
var slopeOptions = require('../../graphics/slope-config');
var geoData = require('../../data/geo-data');


module.exports = function() {
  var router = koa();
  router.use(Router(router));
  router.get('slope', '/slope/:slopeconfig/:constituency', slopeConfig, drawSlope);

  router.get('constituency-map','/map/constituency/:constituency');
  router.get('region-map','/map/region/:region');
  router.get('nation-map','/map/nation/:nation');
  router.get('UK-map','/map/uk');
  router.get('map')
  return router;
};


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