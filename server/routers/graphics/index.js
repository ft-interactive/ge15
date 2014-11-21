var Router = require('koa-router'),
	koa = require('koa'),
	svg = require('../../graphics/svg'),
	geoData = require('../../data/geo-data'),
	resultData = require('../../data/results'),
	parties = require('../../data/parties');


function main() {
  return app().router()
  .get('slope', '/slope/:slopeconfig/:constituency', slopeConfig, drawSlope)
	//TODO specify id as an optinal parameter
  .get('maparea', '/map/:areatype/:mapconfig/:id', mapConfig, drawMap)
  .get('mapgeneral', '/map/:areatype/:mapconfig/', mapConfig, drawMap)
	.get('constituency-bar-chart','/bars/constituency/:barsconfig/:constituency', barsConfig, drawBars);
};

//bar chart stuff

var barsOptions = require('../../graphics/bars-config'),
	barsConfig = function* (next){
		yield next;
	},

	drawBars = function* (next) {
		this.body = yield svg('bars', this.plotConfig);
		yield next;
	};


//map stuff

var mapOptions = require('../../graphics/map-config'),

	mapConfig = function* (next){
		if(mapOptions[this.params.areatype][this.params.mapconfig]) {
			this.plotConfig = mapOptions[this.params.areatype][this.params.mapconfig];
		}else{
			this.plotConfig = mapOptions[this.params.areatype]['small'];
		}
		this.plotConfig.geoJSON = geoData[this.params.areatype](this.params.id, this.plotConfig.detail);
		yield next;
	},

	drawMap = function* (next){
		this.body = yield svg('map', this.plotConfig);
		yield next;
	};


//Slope chart stuff

var slopeOptions = require('../../graphics/slope-config'),
	
	slopeConfig = function* (next){
		if(slopeOptions[this.params.slopeconfig]) {
			this.plotConfig = slopeOptions[this.params.slopeconfig];
		}else{
			this.plotConfig = slopeOptions['small'];
		}
		yield next;
	},


	drawSlope = function* (next){
		var constituencyResults = resultData.constituency(this.params.constituency) // getResultsData(this.params.constituency);

		this.type = 'image/svg+xml';
		this.plotConfig.name = constituencyResults.name;
		this.plotConfig.slopes = this.plotConfig.layout( constituencyResults.parties );
		this.body = yield svg('slope', this.plotConfig);
		yield next;
	};

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
