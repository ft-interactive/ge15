'use strict';

var app = require('../../util/app');
var viewLocals = require('../../middleware/view-locals');
var siteNav = require('../../middleware/site-navigation');
var coalitionData = require('../data/').coalitionForecastData;

function* home(next) {
  var data = yield coalitionData();
  yield this.render('coalition-forecast', { // jshint ignore:line
    coalitions: data.coalitions,
    updated: data.updated,
    page: {
      title: 'Probable coalitions',
      summary: 'The likelihood of parties being in the next government.'
    }
  });
  yield next;
}

function main() {
  return app()
  .use(siteNav())
  .use(viewLocals())
  .router()
  .get('home', '/', home);
}

module.exports = main;
