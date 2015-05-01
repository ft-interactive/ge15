'use strict';

var app = require('../../util/app');
var _ = require('lodash');

var service = require('../../service');

const viewLocals = require('../../middleware/view-locals');
const siteNav = require('../../middleware/site-navigation');


function* home(next) {
  var data = {
    overview:yield service.resultNationalOverview()
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

function main() {

  return app()

    .use(siteNav())

    .use(viewLocals())

    .router()

    .get('/', home)
    .get('/national-overview', nationalOverview);
}

module.exports = main;
