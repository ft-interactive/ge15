'use strict';

var app = require('../../util/app');
var _ = require('lodash');

var service = require('../../service');

const viewLocals = require('../../middleware/view-locals');
const siteNav = require('../../middleware/site-navigation');


function* home(next) {
  var data = {
    overview:yield service.resultNationalOverview(),
    coalitions:yield service.resultNationalCoalitions(),
    page: {
      title: 'Election results',
      summary: 'The Conservative/Lib-Dem coalition is likely to hold office.\nExpect new party alliances to boost the majority.'
    }
  };
  yield this.render('results-index', data);
  yield next;
}

function* nationalOverview(next) {
  var data = {
      overview:yield service.resultNationalOverview()
  };
  yield this.render('result-national-overview', data);
  yield next;
}

function* nationalCoalitions(next) {
  var data = {
    coalitions:yield service.resultNationalCoalitions()
  };
  yield this.render('result-national-coalitions', data);
  yield next;
}

function main() {

  return app()

    .use(siteNav())

    .use(viewLocals())

    .router()

    .get('/', home)
    .get('/national-overview', nationalOverview)
    .get('/national-coalitions', nationalCoalitions);
}

module.exports = main;
