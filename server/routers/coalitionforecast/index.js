'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var coalitionData = require('../data/').coalitionForecastData;

function* home(next) {
  console.log(this.dataObject);
  yield this.render('coalition-forecast', this.dataObject); // jshint ignore:line
  yield next;
}

function main() {
  return app()
  .use(siteNav())
  .use(viewLocals())
  .router()
  .get('home', '/', coalitionData, home);
}

function* setItem(next){
  this.item = 'prediction'; // jshint ignore:line
  yield next;
}

module.exports = main;
if (!module.parent) main().listen(process.env.PORT || 5000);
